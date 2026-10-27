// Which of a household's allergies a food's name points to. Used on the Pantry, where items are plain names.
//
// The word lists must match supabase/functions/_shared/plan-logic.ts, which the planner uses to keep allergens out of
// plans; supabase/scripts/allergens.test.ts fails if they drift apart. This only reads names, so it cannot know what a
// packaged product contains: it catches "Parmesan" or "Soy sauce", never a hidden ingredient. The screen says so.

export const ALLERGEN_WORDS: Record<string, string[]> = {
  'peanuts': ['peanut'],
  'tree-nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'pine nut'],
  'shellfish': ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'crawfish'],
  'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'feta', 'whey', 'ghee'],
  'gluten': ['flour', 'wheat', 'pasta', 'spaghetti', 'noodle', 'bread', 'breadcrumb', 'panko', 'dough', 'flour tortilla', 'couscous', 'bun', 'soy sauce', 'barley', 'oat', 'muffin'],
  'eggs': ['egg', 'mayonnaise', 'mayo'],
  'soy': ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh'],
};

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRegex = (words: string[]) => new RegExp(`\\b(?:${words.map(escape).join('|')})s?\\b`, 'i');

// The household's allergy labels (for example "Tree nuts") that this food's name matches, in the household's order.
// An allergy with no word list is matched on its own name, as the planner does.
export function allergensIn(food: string, allergies: string[]): string[] {
  return allergies.filter((label) => wordRegex(ALLERGEN_WORDS[slug(label)] ?? [label.trim()]).test(food));
}
