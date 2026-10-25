import { z } from "npm:zod@3.23.8";

// A plan is a list of recipe IDs per day. The model may only pick IDs from the candidate list.
export const PlanSchema = z.object({
  items: z
    .array(
      z.object({
        recipe_id: z.string().uuid(),
        day_of_week: z.number().int().min(1).max(7),
      }),
    )
    .min(1)
    .max(7),
});

export type Plan = z.infer<typeof PlanSchema>;

export interface PlanInput {
  householdSize: number;
  weeklyBudgetUsd: number | null;
  allergies: string[];
  dislikes: string[];
  // Recipes the model is allowed to pick from (already filtered server-side)
  candidates: { id: string; title: string; minutes: number; estimatedCostUsd: number }[];
}

export interface PlanProvider {
  name: string;
  generate(input: PlanInput): Promise<Plan>;
}

function buildPrompt(input: PlanInput): string {
  const candidates = input.candidates
    .map((r) => `- ${r.id} | ${r.title} | ${r.minutes} min | ~$${r.estimatedCostUsd.toFixed(2)}`)
    .join("\n");

  return [
    "Create a 7-day dinner plan for a household.",
    `Household size: ${input.householdSize}`,
    `Weekly budget (USD): ${input.weeklyBudgetUsd ?? "no limit"}`,
    `Allergies (must avoid): ${input.allergies.join(", ") || "none"}`,
    `Dislikes (avoid if possible): ${input.dislikes.join(", ") || "none"}`,
    "Only use recipe IDs from the list below. Do not invent IDs.",
    "Return JSON only, in the form {\"items\":[{\"recipe_id\":\"...\",\"day_of_week\":1-7}]}.",
    "Candidates:",
    candidates,
  ].join("\n");
}

// Parses model output and validates it. Throws if the output is not a valid plan
// or if it uses an ID outside the candidate list.
export function parsePlan(raw: string, input: PlanInput): Plan {
  const json = JSON.parse(raw.trim().replace(/^```json\s*|```$/g, ""));
  const plan = PlanSchema.parse(json);
  const allowed = new Set(input.candidates.map((c) => c.id));
  for (const item of plan.items) {
    if (!allowed.has(item.recipe_id)) {
      throw new Error(`Model picked a recipe outside the candidate list: ${item.recipe_id}`);
    }
  }
  return plan;
}

export { buildPrompt };
