// Run with: deno test supabase/functions/generate-plan/
import { assert, assertEquals } from "jsr:@std/assert@1";

import {
  defaultWeekStart,
  hasActiveSubscription,
  isMonday,
  matchesDiet,
  monthStartUtc,
  planTotal,
  selectCandidates,
  shuffle,
  validateWeek,
  violatesAllergy,
  type PlanProfile,
  type RecipeRecord,
} from "./plan-logic.ts";

const recipe = (over: Partial<RecipeRecord> & { id: string }): RecipeRecord => ({
  title: over.id,
  minutes: 30,
  servings: 4,
  tags: [],
  ingredientNames: [],
  baseCostUsd: 20,
  ...over,
});

const profile = (over: Partial<PlanProfile> = {}): PlanProfile => ({
  household_size: 4,
  weekly_budget_usd: 150,
  diet: "any",
  allergies: [],
  dislikes: [],
  ...over,
});

Deno.test("allergy: an explicit contains- tag excludes the recipe", () => {
  assert(violatesAllergy(recipe({ id: "a", tags: ["contains-tree-nuts"] }), ["Tree nuts"]));
});

Deno.test("allergy: ingredient words catch untagged recipes", () => {
  assert(violatesAllergy(recipe({ id: "a", ingredientNames: ["Parmesan"] }), ["Dairy"]));
  assert(violatesAllergy(recipe({ id: "a", ingredientNames: ["Shrimp"] }), ["Shellfish"]));
  assert(violatesAllergy(recipe({ id: "a", ingredientNames: ["Eggs"] }), ["Eggs"]));
  assert(violatesAllergy(recipe({ id: "a", title: "Peanut noodles" }), ["Peanuts"]));
});

Deno.test("allergy: soy sauce counts as both soy and gluten", () => {
  const r = recipe({ id: "a", ingredientNames: ["Soy sauce"] });
  assert(violatesAllergy(r, ["Soy"]));
  assert(violatesAllergy(r, ["Gluten"]));
});

Deno.test("allergy: no false hits on eggplant, butternut, or corn tortillas", () => {
  assertEquals(violatesAllergy(recipe({ id: "a", ingredientNames: ["Eggplant"] }), ["Eggs"]), false);
  assertEquals(violatesAllergy(recipe({ id: "a", ingredientNames: ["Butternut squash"] }), ["Dairy"]), false);
  assertEquals(violatesAllergy(recipe({ id: "a", ingredientNames: ["Corn tortillas"] }), ["Gluten"]), false);
});

Deno.test("allergy: an allergen we have no list for is matched by its own name", () => {
  assert(violatesAllergy(recipe({ id: "a", ingredientNames: ["Sesame oil"] }), ["Sesame"]));
  assertEquals(violatesAllergy(recipe({ id: "a", ingredientNames: ["Olive oil"] }), ["Sesame"]), false);
});

Deno.test("diet: strict diets need an explicit tag, 'any' and unknown do not", () => {
  assertEquals(matchesDiet([], "any"), true);
  assertEquals(matchesDiet([], null), true);
  assertEquals(matchesDiet([], "vegan"), false);
  assertEquals(matchesDiet(["vegan"], "vegetarian"), true);
  assertEquals(matchesDiet(["vegetarian"], "vegan"), false);
  assertEquals(matchesDiet(["pescatarian"], "pescatarian"), true);
  assertEquals(matchesDiet(["halal"], "halal"), true);
  assertEquals(matchesDiet(["vegetarian"], "halal"), true);
});

Deno.test("selectCandidates: filters allergies and diet, and scales cost to the household", () => {
  const recipes = [
    recipe({ id: "ok", baseCostUsd: 12, servings: 4, tags: ["vegetarian"] }),
    recipe({ id: "dairy", tags: ["vegetarian"], ingredientNames: ["Mozzarella"] }),
    recipe({ id: "meat", tags: [] }),
  ];
  const out = selectCandidates(recipes, profile({ diet: "vegetarian", allergies: ["Dairy"], household_size: 6 }));
  assertEquals(out.map((c) => c.id), ["ok"]);
  assertEquals(out[0].estimatedCostUsd, 18); // 12 for 4 servings, scaled to 6 people
});

Deno.test("selectCandidates: dislikes apply only while enough recipes remain", () => {
  const mushroom = (id: string) => recipe({ id, ingredientNames: ["Mushrooms"] });
  const plain = (id: string) => recipe({ id });
  const small = [plain("p1"), plain("p2"), mushroom("m1")];
  assertEquals(selectCandidates(small, profile({ dislikes: ["Mushrooms"] })).length, 3);

  const big = [...Array.from({ length: 14 }, (_, i) => plain(`p${i}`)), mushroom("m1")];
  const out = selectCandidates(big, profile({ dislikes: ["Mushrooms"] }));
  assertEquals(out.length, 14);
  assertEquals(out.some((c) => c.id === "m1"), false);
});

Deno.test("dislikes: olive oil is not olives", () => {
  const big = Array.from({ length: 14 }, (_, i) => recipe({ id: `p${i}`, ingredientNames: ["Olive oil"] }));
  assertEquals(selectCandidates(big, profile({ dislikes: ["Olives"] })).length, 14);
});

Deno.test("dislikes: the spicy tag counts as 'Spicy food'", () => {
  const spicy = recipe({ id: "s", tags: ["spicy"] });
  const plain = Array.from({ length: 14 }, (_, i) => recipe({ id: `p${i}` }));
  const out = selectCandidates([spicy, ...plain], profile({ dislikes: ["Spicy food"] }));
  assertEquals(out.some((c) => c.id === "s"), false);
});

Deno.test("selectCandidates: respects the limit", () => {
  const many = Array.from({ length: 100 }, (_, i) => recipe({ id: `r${i}` }));
  assertEquals(selectCandidates(many, profile(), { limit: 60 }).length, 60);
});

Deno.test("shuffle is deterministic for a fixed rng and keeps every item", () => {
  const rng = () => 0;
  assertEquals(shuffle([1, 2, 3, 4], rng), shuffle([1, 2, 3, 4], rng));
  assertEquals([...shuffle([1, 2, 3, 4])].sort(), [1, 2, 3, 4]);
});

const week = (ids: string[], days = [1, 2, 3, 4, 5, 6, 7]) => ({
  items: ids.map((recipe_id, i) => ({ recipe_id, day_of_week: days[i] })),
});

Deno.test("validateWeek accepts seven distinct dinners on seven distinct days", () => {
  assertEquals(validateWeek(week(["a", "b", "c", "d", "e", "f", "g"])), null);
});

Deno.test("validateWeek rejects short weeks, repeated days, and repeated recipes", () => {
  assert(validateWeek(week(["a", "b", "c"], [1, 2, 3]))?.includes("expected 7"));
  assert(validateWeek(week(["a", "b", "c", "d", "e", "f", "g"], [1, 1, 3, 4, 5, 6, 7]))?.includes("days"));
  assert(validateWeek(week(["a", "a", "c", "d", "e", "f", "g"]))?.includes("more than once"));
});

Deno.test("planTotal sums candidate costs", () => {
  const candidates = [
    { id: "a", title: "A", minutes: 1, estimatedCostUsd: 10.5 },
    { id: "b", title: "B", minutes: 1, estimatedCostUsd: 4.25 },
  ];
  assertEquals(planTotal(week(["a", "b"], [1, 2]), candidates), 14.75);
});

Deno.test("isMonday accepts real Mondays only", () => {
  assertEquals(isMonday("2026-10-26"), true);
  assertEquals(isMonday("2026-10-27"), false);
  assertEquals(isMonday("2026-02-30"), false);
  assertEquals(isMonday("10/26/2026"), false);
});

Deno.test("defaultWeekStart is the upcoming Monday, or today when it is Monday", () => {
  assertEquals(defaultWeekStart(new Date("2026-10-26T12:00:00Z")), "2026-10-26"); // Monday
  assertEquals(defaultWeekStart(new Date("2026-10-27T12:00:00Z")), "2026-11-02"); // Tuesday
  assertEquals(defaultWeekStart(new Date("2026-11-01T12:00:00Z")), "2026-11-02"); // Sunday
  assertEquals(isMonday(defaultWeekStart(new Date("2026-12-31T23:59:00Z"))), true);
});

Deno.test("monthStartUtc is the first of the month", () => {
  assertEquals(monthStartUtc(new Date("2026-10-26T12:00:00Z")), "2026-10-01T00:00:00.000Z");
});

Deno.test("hasActiveSubscription needs an active or trialing row that has not ended", () => {
  const now = new Date("2026-10-26T00:00:00Z");
  assertEquals(hasActiveSubscription([], now), false);
  assertEquals(hasActiveSubscription([{ status: "active", period_end: null }], now), true);
  assertEquals(hasActiveSubscription([{ status: "trialing", period_end: "2026-11-01T00:00:00Z" }], now), true);
  assertEquals(hasActiveSubscription([{ status: "active", period_end: "2026-10-01T00:00:00Z" }], now), false);
  assertEquals(hasActiveSubscription([{ status: "canceled", period_end: null }], now), false);
});
