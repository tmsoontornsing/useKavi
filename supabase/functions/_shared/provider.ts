import { z } from "npm:zod@3.23.8";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

// How many times one recipe may appear in a week, by meal. Dinners are all different. Breakfasts and
// lunches repeat, as they do in real households, which also keeps the grocery bill down.
export const MAX_USES: Record<MealType, number> = { breakfast: 3, lunch: 2, dinner: 1 };

// A plan is one recipe per day and meal type. The model may only pick IDs from the candidate list for that meal.
export const PlanSchema = z.object({
  items: z
    .array(
      z.object({
        recipe_id: z.string().uuid(),
        day_of_week: z.number().int().min(1).max(7),
        meal_type: z.enum(MEAL_TYPES),
      }),
    )
    .min(1)
    .max(21),
});

export type Plan = z.infer<typeof PlanSchema>;

export type Candidate = { id: string; title: string; minutes: number; estimatedCostUsd: number; liked?: boolean };

export interface PlanInput {
  householdSize: number;
  weeklyBudgetUsd: number | null;
  allergies: string[];
  dislikes: string[];
  likes: string[];
  // Recipes the model is allowed to pick from for each meal (already filtered server-side)
  candidates: Record<MealType, Candidate[]>;
}

// Tokens a model call used, as the provider reports them. Only paid providers have any.
export interface Usage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface PlanProvider {
  name: string;
  // `onUsage` is told what a call cost, even when the week it returned turns out to be unusable.
  generate(input: PlanInput, onUsage?: (usage: Usage) => void): Promise<Plan>;
}

function buildPrompt(input: PlanInput): string {
  const list = (type: MealType) =>
    input.candidates[type]
      .map((r) => `- ${r.id} | ${r.title} | ${r.minutes} min | ~$${r.estimatedCostUsd.toFixed(2)}${r.liked ? " | liked" : ""}`)
      .join("\n");

  return [
    "Create a 7-day meal plan for a household: breakfast, lunch and dinner every day, 21 meals in all.",
    `Household size: ${input.householdSize}`,
    `Weekly budget for all 21 meals (USD): ${input.weeklyBudgetUsd ?? "no limit"}`,
    `Allergies (must avoid): ${input.allergies.join(", ") || "none"}`,
    `Dislikes (avoid if possible): ${input.dislikes.join(", ") || "none"}`,
    `Foods they like: ${input.likes.join(", ") || "none"}`,
    "Rules:",
    "- Give each meal type (breakfast, lunch, dinner) exactly one recipe on each day_of_week from 1 to 7.",
    `- Every dinner must be a different recipe. A lunch recipe may be used at most ${MAX_USES.lunch} times and a breakfast recipe at most ${MAX_USES.breakfast} times in the week.`,
    "- Keep the combined cost of all 21 meals within the weekly budget when one is given, and vary the week.",
    "- Prefer recipes marked liked when they fit the budget and the other rules, but still vary the week and never pick only liked recipes if that breaks a rule.",
    "- Only use recipe IDs from the list for that meal type. Do not invent IDs.",
    'Return JSON only, in the form {"items":[{"recipe_id":"...","day_of_week":1-7,"meal_type":"breakfast|lunch|dinner"}]}.',
    "Breakfast candidates:",
    list("breakfast"),
    "Lunch candidates:",
    list("lunch"),
    "Dinner candidates:",
    list("dinner"),
  ].join("\n");
}

// Parses model output and validates it. Throws if the output is not a valid plan
// or if it uses an ID outside the candidate list for its meal type.
export function parsePlan(raw: string, input: PlanInput): Plan {
  const json = JSON.parse(raw.trim().replace(/^```json\s*|```$/g, ""));
  const plan = PlanSchema.parse(json);
  const allowed = Object.fromEntries(MEAL_TYPES.map((t) => [t, new Set(input.candidates[t].map((c) => c.id))])) as Record<
    MealType,
    Set<string>
  >;
  for (const item of plan.items) {
    if (!allowed[item.meal_type].has(item.recipe_id)) {
      throw new Error(`Model picked a recipe outside the ${item.meal_type} candidate list: ${item.recipe_id}`);
    }
  }
  return plan;
}

export { buildPrompt };
