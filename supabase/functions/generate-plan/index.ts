import { basicProvider, providerFromEnv } from "../_shared/adapters.ts";
import { loadProfile, loadRecipes } from "../_shared/data.ts";
import { asCaller, fail, json } from "../_shared/http.ts";
import {
  defaultWeekStart,
  hasActiveSubscription,
  isMonday,
  minCandidates,
  monthStartUtc,
  planTotal,
  reachedPlanCap,
  selectCandidates,
  validateWeek,
} from "../_shared/plan-logic.ts";
import { MEAL_TYPES, type Plan, type PlanInput, type PlanProvider } from "../_shared/provider.ts";

// POST { week_start?: "YYYY-MM-DD" }  (a Monday; defaults to the upcoming Monday, in UTC)
// Authorization: Bearer <the signed-in user's access token>
//
// Builds a week of breakfast, lunch and dinner (21 meals) for the caller from their profile, saves it,
// builds its grocery list, and returns it. Everything runs as the caller, so row-level security applies.
// Env: ANTHROPIC_API_KEY to plan with Claude (otherwise the free built-in planner), or KAVI_PLAN_PROVIDER
// to force one. SUPABASE_URL and the anon key are provided by Supabase.

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const caller = await asCaller(req);
  if (caller instanceof Response) return caller;
  const { db, userId } = caller;

  let weekStart = defaultWeekStart();
  const body = await req.json().catch(() => ({}));
  if (body?.week_start !== undefined) {
    if (typeof body.week_start !== "string" || !isMonday(body.week_start)) {
      return json({ error: "invalid_week_start", message: "week_start must be a Monday, as YYYY-MM-DD" }, 400);
    }
    weekStart = body.week_start;
  }

  let profile, recipes;
  try {
    profile = await loadProfile(db, userId);
    recipes = await loadRecipes(db);
  } catch (e) {
    return fail("generate-plan", "read_failed", (e as Error).message);
  }
  if (!profile) return json({ error: "profile_missing", message: "Finish setting up your household first" }, 409);

  // Free plan: one plan per calendar month. Paid plan: a monthly cap on plan requests, counted in plan_generations
  // because regenerating a week replaces its meal_plans row.
  const { data: subs, error: subsError } = await db.from("subscriptions").select("status, period_end").eq("user_id", userId);
  if (subsError) return fail("generate-plan", "subscription_read_failed", subsError.message);
  if (hasActiveSubscription(subs ?? [])) {
    const { count, error } = await db
      .from("plan_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStartUtc());
    // The cap protects AI spend, so a failed count lets the plan through rather than locking a paying user out.
    if (error) console.error(`generate-plan: plan cap count failed: ${error.message}`);
    else if (reachedPlanCap(count ?? 0)) {
      return json({ error: "plan_cap", message: "You’ve reached this month’s plan limit. It resets on the 1st." }, 429);
    }
  } else {
    const { count, error } = await db
      .from("meal_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStartUtc());
    if (error) return fail("generate-plan", "plan_count_failed", error.message);
    if ((count ?? 0) > 0) {
      return json({ error: "plan_limit", message: "The free plan includes one plan a month." }, 402);
    }
  }

  const candidates = selectCandidates(recipes, profile);
  const short = MEAL_TYPES.filter((t) => candidates[t].length < minCandidates(t));
  if (short.length > 0) {
    return json(
      {
        error: "not_enough_recipes",
        message: `Not enough ${short.join(" and ")} recipes match your allergies, diet and kitchen to fill a week.`,
        available: Object.fromEntries(MEAL_TYPES.map((t) => [t, candidates[t].length])),
      },
      422,
    );
  }

  const input: PlanInput = {
    householdSize: profile.household_size,
    weeklyBudgetUsd: profile.weekly_budget_usd,
    allergies: profile.allergies,
    dislikes: profile.dislikes,
    likes: profile.likes,
    candidates,
  };

  // Count the request before the model runs: a failed attempt still costs money.
  const { error: logError } = await db.from("plan_generations").insert({ user_id: userId });
  if (logError) console.error(`generate-plan: could not record the request: ${logError.message}`);

  // A model can return a malformed or repetitive week: allow it one retry, then fall back to the
  // built-in planner so the household always gets a plan.
  const providers: PlanProvider[] = [];
  try {
    const preferred = providerFromEnv((k) => Deno.env.get(k));
    providers.push(preferred, preferred);
  } catch (e) {
    console.error(`generate-plan: provider setup failed: ${(e as Error).message}`);
  }
  providers.push(basicProvider());
  let plan: Plan | null = null;
  for (const provider of providers) {
    try {
      const attempt = await provider.generate(input);
      const problem = validateWeek(attempt);
      if (!problem) {
        plan = attempt;
        break;
      }
      console.error(`generate-plan: ${provider.name} returned an unusable week: ${problem}`);
    } catch (e) {
      console.error(`generate-plan: ${provider.name} failed: ${(e as Error).message}`);
    }
  }
  if (!plan) return json({ error: "plan_generation_failed", message: "Could not build a plan. Try again." }, 502);

  // Replace any plan for this week (items and grocery list cascade), then save the new one.
  const { error: deleteError } = await db.from("meal_plans").delete().eq("user_id", userId).eq("week_start", weekStart);
  if (deleteError) return fail("generate-plan", "plan_replace_failed", deleteError.message);
  const { data: planRow, error: planError } = await db
    .from("meal_plans")
    .insert({ user_id: userId, week_start: weekStart, status: "generated" })
    .select("id")
    .single();
  if (planError || !planRow) return fail("generate-plan", "plan_save_failed", planError?.message ?? "no row returned");
  const { error: itemsError } = await db.from("meal_plan_items").insert(
    plan.items.map((i) => ({ plan_id: planRow.id, recipe_id: i.recipe_id, day_of_week: i.day_of_week, meal_type: i.meal_type })),
  );
  if (itemsError) {
    await db.from("meal_plans").delete().eq("id", planRow.id);
    return fail("generate-plan", "plan_items_save_failed", itemsError.message);
  }

  // The plan is saved either way; the app rebuilds the list on its next change if this step fails.
  const { error: listError } = await db.rpc("rebuild_grocery_list", { p_plan_id: planRow.id });
  if (listError) console.error(`generate-plan: grocery list build failed: ${listError.message}`);

  const total = planTotal(plan, candidates);
  return json({
    plan_id: planRow.id,
    week_start: weekStart,
    estimated_total_usd: total,
    over_budget: profile.weekly_budget_usd !== null && total > profile.weekly_budget_usd,
    grocery_list_ready: !listError,
  });
});
