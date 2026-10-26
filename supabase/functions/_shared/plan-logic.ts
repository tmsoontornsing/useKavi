import { MAX_USES, MEAL_TYPES, type MealType, type Plan, type PlanInput } from "./provider.ts";

// Pure decision logic for plan generation: which recipes may be offered to the model, what they
// cost for this household, and whether the model's answer is a usable week. No I/O, so it is
// unit-tested without a database or a model.

export type RecipeRecord = {
  id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  ingredientNames: string[];
  // Sum of quantity x avg price over the recipe's lines, for `servings` servings.
  baseCostUsd: number;
};

export type PlanProfile = {
  household_size: number;
  weekly_budget_usd: number | null;
  diet: string | null;
  allergies: string[];
  dislikes: string[];
  // Equipment ids the household has, e.g. "oven". Empty means not specified, so nothing is filtered.
  appliances: string[];
};

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const round2 = (n: number) => Math.round(n * 100) / 100;

// Word list per allergen, matched against recipe titles and ingredient names. This is a safety net
// that errs toward excluding. The reliable signal is an explicit `contains-<allergen>` tag on the
// recipe, which is always honoured. Edit these lists as the catalog grows.
const ALLERGEN_WORDS: Record<string, string[]> = {
  "peanuts": ["peanut"],
  "tree-nuts": ["almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut", "macadamia", "pine nut"],
  "shellfish": ["shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster", "scallop", "crawfish"],
  "dairy": ["milk", "cheese", "butter", "cream", "yogurt", "mozzarella", "parmesan", "cheddar", "ricotta", "feta", "whey", "ghee"],
  "gluten": ["flour", "wheat", "pasta", "spaghetti", "noodle", "bread", "breadcrumb", "panko", "dough", "flour tortilla", "couscous", "bun", "soy sauce", "barley", "oat", "muffin"],
  "eggs": ["egg", "mayonnaise", "mayo"],
  "soy": ["soy", "soya", "tofu", "edamame", "miso", "tempeh"],
};

// Dislikes are softer than allergies, so these only need to catch the obvious cases.
const DISLIKE_WORDS: Record<string, string[]> = {
  "mushrooms": ["mushroom"],
  // Plural only, so "olive oil" does not count as olives.
  "olives": ["olives", "kalamata"],
  "eggplant": ["eggplant", "aubergine"],
  "spicy-food": ["jalapeno", "cayenne", "sriracha", "chipotle", "habanero", "red pepper flakes"],
  "tofu": ["tofu"],
  "fish": ["fish", "salmon", "cod", "tuna", "tilapia", "trout", "halibut", "sardine", "anchovy", "anchovies"],
};

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRegex = (words: string[]) => new RegExp(`\\b(?:${words.map(escape).join("|")})s?\\b`, "i");

const haystack = (r: RecipeRecord) => [r.title, ...r.ingredientNames].join(" | ");

export function violatesAllergy(r: RecipeRecord, allergies: string[]): boolean {
  return allergies.some((label) => {
    const s = slug(label);
    if (!s) return false;
    if (r.tags.includes(`contains-${s}`)) return true;
    // An allergy we have no word list for is matched on its own name, so it still filters.
    return wordRegex(ALLERGEN_WORDS[s] ?? [label.trim()]).test(haystack(r));
  });
}

// Recipe tags that mark a disliked thing when the tag name differs from the dislike's name.
const DISLIKE_TAGS: Record<string, string[]> = { "spicy-food": ["spicy"] };

function dislikes(r: RecipeRecord, label: string): boolean {
  const s = slug(label);
  if (!s) return false;
  if ([s, `contains-${s}`, ...(DISLIKE_TAGS[s] ?? [])].some((t) => r.tags.includes(t))) return true;
  return wordRegex(DISLIKE_WORDS[s] ?? [label.trim()]).test(haystack(r));
}

// Which recipe tags satisfy each diet. Strict diets need an explicit tag, so an untagged recipe
// is never offered to a vegan. Unknown or missing diets apply no filter.
const DIET_TAGS: Record<string, string[]> = {
  vegan: ["vegan"],
  vegetarian: ["vegetarian", "vegan"],
  pescatarian: ["pescatarian", "vegetarian", "vegan"],
  lowcarb: ["lowcarb"],
  halal: ["halal", "vegetarian", "vegan"],
};

export function matchesDiet(tags: string[], diet: string | null): boolean {
  const accepted = diet ? DIET_TAGS[diet] : undefined;
  return !accepted || accepted.some((t) => tags.includes(t));
}

// A recipe tagged `needs-<appliance>` is only offered to households that have that appliance.
export function hasEquipment(tags: string[], appliances: string[]): boolean {
  if (appliances.length === 0) return true;
  return tags.filter((t) => t.startsWith("needs-")).every((t) => appliances.includes(t.slice("needs-".length)));
}

export function shuffle<T>(list: T[], rng: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The fewest recipes a meal type needs to fill a week without breaking its repeat limit.
export const minCandidates = (type: MealType) => Math.ceil(7 / MAX_USES[type]);

// Recipes the model may choose from, for each meal. A recipe is offered for a meal when it carries that
// meal's tag (`breakfast`, `lunch`, `dinner`), so one recipe can serve more than one meal. Allergies,
// diet and equipment are hard filters. Dislikes are applied only while enough variety remains, so a
// small catalog never starves the plan.
export function selectCandidates(
  recipes: RecipeRecord[],
  profile: PlanProfile,
  opts: { limit?: number; rng?: () => number } = {},
): PlanInput["candidates"] {
  const { limit = 40, rng = Math.random } = opts;
  const safe = recipes.filter(
    (r) =>
      !violatesAllergy(r, profile.allergies) &&
      matchesDiet(r.tags, profile.diet) &&
      hasEquipment(r.tags, profile.appliances),
  );
  const forMeal = (type: MealType) => {
    const ofType = safe.filter((r) => r.tags.includes(type));
    const liked = ofType.filter((r) => !profile.dislikes.some((d) => dislikes(r, d)));
    // Keep two weeks' worth of variety before letting dislikes thin the list.
    const pool = liked.length >= minCandidates(type) * 2 ? liked : ofType;
    return shuffle(pool, rng)
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        title: r.title,
        minutes: r.minutes,
        // Scale the recipe from its own servings to this household.
        estimatedCostUsd: round2((r.baseCostUsd * profile.household_size) / r.servings),
      }));
  };
  return { breakfast: forMeal("breakfast"), lunch: forMeal("lunch"), dinner: forMeal("dinner") };
}

// A week is breakfast, lunch and dinner on each of seven days, with no recipe used more often than its
// meal allows. The provider schema only checks shape.
export function validateWeek(plan: Plan): string | null {
  if (plan.items.length !== 21) return `expected 21 meals, got ${plan.items.length}`;
  const slots = new Set(plan.items.map((i) => `${i.day_of_week}|${i.meal_type}`));
  if (slots.size !== 21) return "a day and meal is missing or used twice";
  for (const type of MEAL_TYPES) {
    const uses = new Map<string, number>();
    for (const i of plan.items) if (i.meal_type === type) uses.set(i.recipe_id, (uses.get(i.recipe_id) ?? 0) + 1);
    const most = Math.max(...uses.values());
    if (most > MAX_USES[type]) return `a ${type} recipe is used ${most} times, more than ${MAX_USES[type]}`;
  }
  return null;
}

export function planTotal(plan: Plan, candidates: PlanInput["candidates"]): number {
  const cost = new Map(MEAL_TYPES.flatMap((t) => candidates[t]).map((c) => [c.id, c.estimatedCostUsd]));
  return round2(plan.items.reduce((sum, i) => sum + (cost.get(i.recipe_id) ?? 0), 0));
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isMonday(date: string): boolean {
  if (!DATE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(date) && d.getUTCDay() === 1;
}

// The upcoming Monday (today if it is Monday), in UTC. Clients know the user's timezone, so the
// app should send week_start explicitly. This is only the fallback.
export function defaultWeekStart(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7));
  return d.toISOString().slice(0, 10);
}

export function monthStartUtc(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function hasActiveSubscription(rows: { status: string; period_end: string | null }[], now: Date = new Date()): boolean {
  return rows.some((r) => ["active", "trialing"].includes(r.status) && (!r.period_end || new Date(r.period_end) > now));
}
