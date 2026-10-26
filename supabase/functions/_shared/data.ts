import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";

import type { PlanProfile, RecipeRecord } from "./plan-logic.ts";

// Reads shared by the plan functions. Both run as the caller, so row-level security applies.

export async function loadProfile(db: SupabaseClient, userId: string): Promise<PlanProfile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("household_size, weekly_budget_usd, diet, allergies, dislikes, appliances")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`profile read failed: ${error.message}`);
  if (!data) return null;
  return { ...data, weekly_budget_usd: data.weekly_budget_usd === null ? null : Number(data.weekly_budget_usd) };
}

type RecipeQueryRow = {
  id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  recipe_ingredients: { quantity: number; ingredient: { name: string; avg_price_usd: number } | null }[];
};

// The whole catalog with each recipe's ingredient names and cost. Fine at a few hundred recipes;
// past PostgREST's 1,000-row page this needs paging.
export async function loadRecipes(db: SupabaseClient): Promise<RecipeRecord[]> {
  const { data, error } = await db
    .from("recipes")
    .select("id, title, minutes, servings, tags, recipe_ingredients(quantity, ingredient:ingredients(name, avg_price_usd))")
    .limit(1000)
    .returns<RecipeQueryRow[]>();
  if (error) throw new Error(`recipe read failed: ${error.message}`);
  return (data ?? []).map((r) => {
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
}
