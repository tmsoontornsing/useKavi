import { createClient } from "npm:@supabase/supabase-js@2.118.0";

import { providerFromEnv } from "./adapters.ts";
import {
  defaultWeekStart,
  hasActiveSubscription,
  isMonday,
  monthStartUtc,
  planTotal,
  selectCandidates,
  validateWeek,
  type PlanProfile,
  type RecipeRecord,
} from "./plan-logic.ts";
import type { Plan, PlanInput } from "./provider.ts";

// POST { week_start?: "YYYY-MM-DD" }  (a Monday; defaults to the upcoming Monday, in UTC)
// Authorization: Bearer <the signed-in user's access token>
//
// Builds a 7-dinner plan for the caller from their profile, saves it, and returns it. Every read
// and write runs as the caller, so row-level security applies. Env: KAVI_PLAN_PROVIDER, and
// ANTHROPIC_API_KEY when it is "claude". SUPABASE_URL and SUPABASE_ANON_KEY are provided by Supabase.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type RecipeQueryRow = {
  id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  recipe_ingredients: { quantity: number; ingredient: { name: string; avg_price_usd: number } | null }[];
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "unauthorized" }, 401);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userError } = await db.auth.getUser();
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);
  const userId = userData.user.id;

  let weekStart = defaultWeekStart();
  const body = await req.json().catch(() => ({}));
  if (body?.week_start !== undefined) {
    if (typeof body.week_start !== "string" || !isMonday(body.week_start)) {
      return json({ error: "invalid_week_start", message: "week_start must be a Monday, as YYYY-MM-DD" }, 400);
    }
    weekStart = body.week_start;
  }

  const { data: profileRow, error: profileError } = await db
    .from("profiles")
    .select("household_size, weekly_budget_usd, diet, allergies, dislikes, appliances")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return fail("profile_read_failed", profileError.message);
  if (!profileRow) return json({ error: "profile_missing", message: "Finish setting up your household first" }, 409);
  const profile: PlanProfile = {
    ...profileRow,
    weekly_budget_usd: profileRow.weekly_budget_usd === null ? null : Number(profileRow.weekly_budget_usd),
  };

  // Free plan: one plan per calendar month. Paid plan: unlimited.
  const { data: subs, error: subsError } = await db.from("subscriptions").select("status, period_end").eq("user_id", userId);
  if (subsError) return fail("subscription_read_failed", subsError.message);
  if (!hasActiveSubscription(subs ?? [])) {
    const { count, error } = await db
      .from("meal_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStartUtc());
    if (error) return fail("plan_count_failed", error.message);
    if ((count ?? 0) > 0) {
      return json({ error: "plan_limit", message: "The free plan includes one plan per month" }, 402);
    }
  }

  const { data: recipeRows, error: recipeError } = await db
    .from("recipes")
    .select("id, title, minutes, servings, tags, recipe_ingredients(quantity, ingredient:ingredients(name, avg_price_usd))")
    .limit(1000)
    .returns<RecipeQueryRow[]>();
  if (recipeError) return fail("recipe_read_failed", recipeError.message);

  const recipes: RecipeRecord[] = (recipeRows ?? []).map((r) => {
    const lines = r.recipe_ingredients.filter((l) => l.ingredient);
    return {
      id: r.id,
      title: r.title,
      minutes: r.minutes,
      servings: r.servings,
      tags: r.tags,
      ingredientNames: lines.map((l) => l.ingredient!.name),
      baseCostUsd: lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.ingredient!.avg_price_usd), 0),
    };
  });

  const candidates = selectCandidates(recipes, profile);
  if (candidates.length < 7) {
    return json(
      { error: "not_enough_recipes", message: "Not enough recipes match your allergies, diet and kitchen to fill a week", available: candidates.length },
      422,
    );
  }

  const input: PlanInput = {
    householdSize: profile.household_size,
    weeklyBudgetUsd: profile.weekly_budget_usd,
    allergies: profile.allergies,
    dislikes: profile.dislikes,
    candidates,
  };

  // The model can return a malformed or repetitive week, so allow one retry before giving up.
  const provider = providerFromEnv((k) => Deno.env.get(k));
  let plan: Plan | null = null;
  let lastProblem = "";
  for (let attempt = 0; attempt < 2 && !plan; attempt++) {
    try {
      const candidate = await provider.generate(input);
      const problem = validateWeek(candidate);
      if (problem) lastProblem = problem;
      else plan = candidate;
    } catch (e) {
      lastProblem = (e as Error).message;
    }
  }
  if (!plan) {
    console.error(`generate-plan: provider ${provider.name} gave no usable plan: ${lastProblem}`);
    return json({ error: "plan_generation_failed", message: "Could not build a plan. Try again." }, 502);
  }

  // Replace any plan for this week (items and grocery list cascade), then save the new one.
  const { error: deleteError } = await db.from("meal_plans").delete().eq("user_id", userId).eq("week_start", weekStart);
  if (deleteError) return fail("plan_replace_failed", deleteError.message);
  const { data: planRow, error: planError } = await db
    .from("meal_plans")
    .insert({ user_id: userId, week_start: weekStart, status: "generated" })
    .select("id")
    .single();
  if (planError || !planRow) return fail("plan_save_failed", planError?.message ?? "no row returned");
  const { error: itemsError } = await db
    .from("meal_plan_items")
    .insert(plan.items.map((i) => ({ plan_id: planRow.id, recipe_id: i.recipe_id, day_of_week: i.day_of_week })));
  if (itemsError) {
    await db.from("meal_plans").delete().eq("id", planRow.id);
    return fail("plan_items_save_failed", itemsError.message);
  }

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const total = planTotal(plan, candidates);
  return json({
    plan_id: planRow.id,
    week_start: weekStart,
    items: [...plan.items]
      .sort((a, b) => a.day_of_week - b.day_of_week)
      .map((i) => ({
        day_of_week: i.day_of_week,
        recipe_id: i.recipe_id,
        title: byId.get(i.recipe_id)!.title,
        minutes: byId.get(i.recipe_id)!.minutes,
        estimated_cost_usd: byId.get(i.recipe_id)!.estimatedCostUsd,
      })),
    estimated_total_usd: total,
    over_budget: profile.weekly_budget_usd !== null && total > profile.weekly_budget_usd,
  });
});

// Server errors keep the detail in the logs and give the client a short, safe message.
function fail(code: string, detail: string) {
  console.error(`generate-plan: ${code}: ${detail}`);
  return json({ error: code, message: "Something went wrong. Try again." }, 500);
}
