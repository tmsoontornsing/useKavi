// Run with: deno test supabase/functions/generate-plan/
import { assert, assertEquals } from "jsr:@std/assert@1";

import {
  defaultWeekStart,
  hasActiveSubscription,
  hasEquipment,
  isMonday,
  matchesDiet,
  minCandidates,
  monthStartUtc,
  planTotal,
  selectCandidates,
  shuffle,
  validateWeek,
  violatesAllergy,
  type PlanProfile,
  type RecipeRecord,
} from "./plan-logic.ts";
import type { Plan } from "./provider.ts";

// Recipes default to dinner, because a recipe is only offered for a meal it is tagged for.
const recipe = (over: Partial<RecipeRecord> & { id: string }): RecipeRecord => ({
  title: over.id,
  minutes: 30,
  servings: 4,
  tags: ["dinner"],
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
  appliances: [],
  ...over,
});

const dinnerIds = (recipes: RecipeRecord[], p: PlanProfile = profile()) =>
  selectCandidates(recipes, p, { rng: () => 0 }).dinner.map((c) => c.id).sort();

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

Deno.test("allergy: oats and English muffins count as gluten, because oats are usually cross-contaminated", () => {
  assert(violatesAllergy(recipe({ id: "a", ingredientNames: ["Rolled oats"] }), ["Gluten"]));
  assert(violatesAllergy(recipe({ id: "a", ingredientNames: ["English muffins"] }), ["Gluten"]));
  assertEquals(violatesAllergy(recipe({ id: "a", ingredientNames: ["Goat cheese"] }), ["Gluten"]), false);
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

Deno.test("meals: a recipe is offered only for the meals it is tagged for", () => {
  const recipes = [
    recipe({ id: "oats", tags: ["breakfast"] }),
    recipe({ id: "salad", tags: ["lunch", "dinner"] }),
    recipe({ id: "stew", tags: ["dinner"] }),
    recipe({ id: "untagged", tags: [] }),
  ];
  const out = selectCandidates(recipes, profile(), { rng: () => 0 });
  assertEquals(out.breakfast.map((c) => c.id), ["oats"]);
  assertEquals(out.lunch.map((c) => c.id), ["salad"]);
  assertEquals(out.dinner.map((c) => c.id).sort(), ["salad", "stew"]);
});

Deno.test("meals: the fewest recipes a week needs follows each meal's repeat limit", () => {
  assertEquals(minCandidates("dinner"), 7);
  assertEquals(minCandidates("lunch"), 4);
  assertEquals(minCandidates("breakfast"), 3);
});

Deno.test("selectCandidates: filters allergies and diet, and scales cost to the household", () => {
  const recipes = [
    recipe({ id: "ok", baseCostUsd: 12, servings: 4, tags: ["dinner", "vegetarian"] }),
    recipe({ id: "dairy", tags: ["dinner", "vegetarian"], ingredientNames: ["Mozzarella"] }),
    recipe({ id: "meat", tags: ["dinner"] }),
  ];
  const out = selectCandidates(recipes, profile({ diet: "vegetarian", allergies: ["Dairy"], household_size: 6 }), { rng: () => 0 });
  assertEquals(out.dinner.map((c) => c.id), ["ok"]);
  assertEquals(out.dinner[0].estimatedCostUsd, 18); // 12 for 4 servings, scaled to 6 people
});

Deno.test("selectCandidates: dislikes apply only while enough recipes remain", () => {
  const mushroom = (id: string) => recipe({ id, ingredientNames: ["Mushrooms"] });
  const plain = (id: string) => recipe({ id });
  const small = [plain("p1"), plain("p2"), mushroom("m1")];
  assertEquals(dinnerIds(small, profile({ dislikes: ["Mushrooms"] })).length, 3);

  const big = [...Array.from({ length: 14 }, (_, i) => plain(`p${i}`)), mushroom("m1")];
  const out = dinnerIds(big, profile({ dislikes: ["Mushrooms"] }));
  assertEquals(out.length, 14);
  assertEquals(out.includes("m1"), false);
});

Deno.test("dislikes: olive oil is not olives", () => {
  const big = Array.from({ length: 14 }, (_, i) => recipe({ id: `p${i}`, ingredientNames: ["Olive oil"] }));
  assertEquals(dinnerIds(big, profile({ dislikes: ["Olives"] })).length, 14);
});

Deno.test("dislikes: the spicy tag counts as 'Spicy food'", () => {
  const spicy = recipe({ id: "s", tags: ["dinner", "spicy"] });
  const plain = Array.from({ length: 14 }, (_, i) => recipe({ id: `p${i}` }));
  assertEquals(dinnerIds([spicy, ...plain], profile({ dislikes: ["Spicy food"] })).includes("s"), false);
});

Deno.test("equipment: a recipe needs every appliance it is tagged with", () => {
  assertEquals(hasEquipment(["needs-oven", "needs-stovetop"], ["oven", "stovetop", "microwave"]), true);
  assertEquals(hasEquipment(["needs-oven", "needs-stovetop"], ["stovetop"]), false);
  assertEquals(hasEquipment(["needs-slow-cooker"], ["oven", "stovetop"]), false);
});

Deno.test("equipment: untagged recipes are always fine, and an empty list filters nothing", () => {
  assertEquals(hasEquipment([], ["microwave"]), true);
  assertEquals(hasEquipment(["needs-oven"], []), true);
});

Deno.test("selectCandidates: drops recipes that need equipment the household lacks", () => {
  const recipes = [
    recipe({ id: "roast", tags: ["dinner", "needs-oven"] }),
    recipe({ id: "pot", tags: ["dinner", "needs-stovetop"] }),
    recipe({ id: "chili", tags: ["dinner", "needs-stovetop", "needs-slow-cooker"] }),
  ];
  const ids = (appliances: string[]) => dinnerIds(recipes, profile({ appliances }));
  assertEquals(ids(["stovetop"]), ["pot"]);
  assertEquals(ids(["stovetop", "oven"]), ["pot", "roast"]);
  assertEquals(ids(["stovetop", "slow-cooker"]), ["chili", "pot"]);
  assertEquals(ids([]), ["chili", "pot", "roast"]);
});

Deno.test("selectCandidates: respects the limit per meal", () => {
  const many = Array.from({ length: 100 }, (_, i) => recipe({ id: `r${i}` }));
  assertEquals(selectCandidates(many, profile(), { limit: 60 }).dinner.length, 60);
});

Deno.test("shuffle is deterministic for a fixed rng and keeps every item", () => {
  const rng = () => 0;
  assertEquals(shuffle([1, 2, 3, 4], rng), shuffle([1, 2, 3, 4], rng));
  assertEquals([...shuffle([1, 2, 3, 4])].sort(), [1, 2, 3, 4]);
});

// A valid week: breakfasts used up to 3 times, lunches up to 2, dinners all different.
const goodWeek = (): Plan => ({
  items: Array.from({ length: 7 }, (_, d) => d + 1).flatMap((day) => [
    { recipe_id: `b${Math.ceil(day / 3)}`, day_of_week: day, meal_type: "breakfast" as const },
    { recipe_id: `l${Math.ceil(day / 2)}`, day_of_week: day, meal_type: "lunch" as const },
    { recipe_id: `d${day}`, day_of_week: day, meal_type: "dinner" as const },
  ]),
});

Deno.test("validateWeek accepts three meals a day within the repeat limits", () => {
  assertEquals(validateWeek(goodWeek()), null);
});

Deno.test("validateWeek rejects a week that is short or has a slot twice", () => {
  const short = goodWeek();
  short.items.pop();
  assert(validateWeek(short)?.includes("expected 21"));

  const doubled = goodWeek();
  doubled.items[1] = { ...doubled.items[1], day_of_week: 1, meal_type: "breakfast" };
  assert(validateWeek(doubled)?.includes("missing or used twice"));
});

Deno.test("validateWeek enforces the repeat limit for each meal", () => {
  const dinnerTwice = goodWeek();
  dinnerTwice.items[5] = { ...dinnerTwice.items[5], recipe_id: "d1" };
  assert(validateWeek(dinnerTwice)?.includes("dinner recipe is used 2 times"));

  const lunchThrice = goodWeek();
  lunchThrice.items[7] = { ...lunchThrice.items[7], recipe_id: "l1" }; // l1 is already the lunch on days 1 and 2
  assert(validateWeek(lunchThrice)?.includes("lunch recipe is used 3 times"));

  const breakfastFour = goodWeek();
  breakfastFour.items[18] = { ...breakfastFour.items[18], recipe_id: "b1" }; // day 7 breakfast
  assert(validateWeek(breakfastFour)?.includes("breakfast recipe is used 4 times"));
});

Deno.test("planTotal sums candidate costs across meals", () => {
  const cand = (id: string, estimatedCostUsd: number) => ({ id, title: id, minutes: 1, estimatedCostUsd });
  const candidates = { breakfast: [cand("b", 4)], lunch: [cand("l", 6.5)], dinner: [cand("d", 10.25)] };
  const plan: Plan = {
    items: [
      { recipe_id: "b", day_of_week: 1, meal_type: "breakfast" },
      { recipe_id: "l", day_of_week: 1, meal_type: "lunch" },
      { recipe_id: "d", day_of_week: 1, meal_type: "dinner" },
    ],
  };
  assertEquals(planTotal(plan, candidates), 20.75);
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
