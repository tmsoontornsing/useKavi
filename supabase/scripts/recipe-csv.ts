// Parses and validates the recipe catalog CSVs. Pure functions with no I/O or imports, so the
// same file runs under Node (the import script) and Deno, and is easy to test.

export type IngredientRow = { name: string; aisle: string; avg_price_usd: number; unit: string };
export type RecipeRow = { title: string; steps: string; servings: number; minutes: number; tags: string[] };
export type RecipeIngredientRow = { recipe_title: string; ingredient_name: string; quantity: number; unit: string };
export type Catalog = {
  ingredients: IngredientRow[];
  recipes: RecipeRow[];
  recipeIngredients: RecipeIngredientRow[];
};

// Every recipe needs at least one of these tags: the meals it can be planned for.
export const MEAL_TAGS = ['breakfast', 'lunch', 'dinner'] as const;

// Case- and spacing-insensitive key for matching names across files.
export const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

// RFC 4180 parser: quoted fields, "" escapes, embedded newlines, CRLF, and a leading BOM.
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else {
        field += ch;
      }
      i++;
      continue;
    }
    if (ch === '"' && field === '') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') field += ch;
    i++;
  }
  if (quoted) throw new Error('unterminated quoted field');
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

type Record_ = { row: number; v: Record<string, string> };

// Turns rows into records keyed by header. `row` counts data rows from 1, not file lines,
// because quoted fields can span lines.
function table(text: string, file: string, required: string[], errors: string[]): Record_[] {
  let rows: string[][];
  try {
    rows = parseCsv(text);
  } catch (e) {
    errors.push(`${file}: ${(e as Error).message}`);
    return [];
  }
  if (rows.length === 0) {
    errors.push(`${file}: file is empty`);
    return [];
  }
  const header = rows[0].map(key);
  const missing = required.filter((c) => !header.includes(c));
  if (missing.length) {
    errors.push(`${file}: missing column(s): ${missing.join(', ')} (found: ${header.join(', ')})`);
    return [];
  }
  const out: Record_[] = [];
  rows.slice(1).forEach((cells, i) => {
    if (cells.length > header.length) {
      errors.push(`${file} row ${i + 1}: ${cells.length} values but only ${header.length} columns. Quote any field containing a comma.`);
      return;
    }
    const v: Record<string, string> = {};
    header.forEach((h, c) => (v[h] = (cells[c] ?? '').trim()));
    out.push({ row: i + 1, v });
  });
  return out;
}

// Accepts "3.49" or "$3.49". NaN when empty or not a number.
const num = (s: string) => {
  const t = s.replace(/[$,\s]/g, '');
  return t === '' ? NaN : Number(t);
};
const cents = (n: number) => Math.round(n * 100) / 100;

export function parseCatalog(files: { ingredients: string; recipes: string; recipeIngredients: string }): {
  catalog: Catalog;
  errors: string[];
} {
  const errors: string[] = [];

  const ingredients: IngredientRow[] = [];
  const ingredientByKey = new Map<string, IngredientRow>();
  for (const { row, v } of table(files.ingredients, 'ingredients.csv', ['name', 'aisle', 'avg_price_usd', 'unit'], errors)) {
    const where = `ingredients.csv row ${row}`;
    const price = num(v.avg_price_usd);
    if (!v.name) errors.push(`${where}: name is empty`);
    else if (ingredientByKey.has(key(v.name))) errors.push(`${where}: duplicate ingredient "${v.name}"`);
    if (!v.aisle) errors.push(`${where}: aisle is empty`);
    if (!v.unit) errors.push(`${where}: unit is empty`);
    if (!Number.isFinite(price) || price < 0 || price > 999999.99) {
      errors.push(`${where}: avg_price_usd must be a number from 0 to 999999.99, got "${v.avg_price_usd}"`);
    }
    if (v.name && v.aisle && v.unit && Number.isFinite(price) && price >= 0) {
      const r = { name: v.name, aisle: v.aisle, avg_price_usd: cents(price), unit: v.unit };
      if (!ingredientByKey.has(key(v.name))) {
        ingredientByKey.set(key(v.name), r);
        ingredients.push(r);
      }
    }
  }

  const recipes: RecipeRow[] = [];
  const recipeKeys = new Set<string>();
  for (const { row, v } of table(files.recipes, 'recipes.csv', ['title', 'servings', 'minutes', 'steps'], errors)) {
    const where = `recipes.csv row ${row}`;
    const servings = num(v.servings);
    const minutes = num(v.minutes);
    if (!v.title) errors.push(`${where}: title is empty`);
    else if (recipeKeys.has(key(v.title))) errors.push(`${where}: duplicate recipe "${v.title}"`);
    if (!v.steps) errors.push(`${where}: steps is empty`);
    if (!Number.isInteger(servings) || servings <= 0) errors.push(`${where}: servings must be a whole number above 0, got "${v.servings}"`);
    if (!Number.isInteger(minutes) || minutes <= 0) errors.push(`${where}: minutes must be a whole number above 0, got "${v.minutes}"`);
    const tags = [...new Set((v.tags ?? '').split('|').map(key).filter(Boolean))];
    // The plan function only offers a recipe for a meal it is tagged for, so an untagged one would never be planned.
    if (v.title && !tags.some((t) => (MEAL_TAGS as readonly string[]).includes(t))) {
      errors.push(`${where}: tags must include at least one of ${MEAL_TAGS.join(', ')}`);
    }
    if (v.title && v.steps && Number.isInteger(servings) && servings > 0 && Number.isInteger(minutes) && minutes > 0 && !recipeKeys.has(key(v.title))) {
      recipeKeys.add(key(v.title));
      recipes.push({ title: v.title, steps: v.steps, servings, minutes, tags });
    }
  }

  const recipeIngredients: RecipeIngredientRow[] = [];
  const seen = new Set<string>();
  const hasIngredients = new Set<string>();
  const riColumns = ['recipe_title', 'ingredient_name', 'quantity', 'unit'];
  for (const { row, v } of table(files.recipeIngredients, 'recipe_ingredients.csv', riColumns, errors)) {
    const where = `recipe_ingredients.csv row ${row}`;
    const quantity = num(v.quantity);
    const ingredient = ingredientByKey.get(key(v.ingredient_name));
    let ok = true;
    if (!recipeKeys.has(key(v.recipe_title))) {
      errors.push(`${where}: recipe "${v.recipe_title}" is not in recipes.csv`);
      ok = false;
    }
    if (!ingredient) {
      errors.push(`${where}: ingredient "${v.ingredient_name}" is not in ingredients.csv`);
      ok = false;
    }
    if (!Number.isFinite(quantity) || cents(quantity) <= 0 || quantity > 999999.99) {
      errors.push(`${where}: quantity must be a number from 0.01 to 999999.99, got "${v.quantity}"`);
      ok = false;
    }
    // Costs are quantity x price, so the recipe line must use the ingredient's pricing unit.
    if (ingredient && key(v.unit) !== key(ingredient.unit)) {
      errors.push(`${where}: unit "${v.unit}" does not match ${ingredient.name}'s pricing unit "${ingredient.unit}"`);
      ok = false;
    }
    const pair = `${key(v.recipe_title)}|${key(v.ingredient_name)}`;
    if (seen.has(pair)) {
      errors.push(`${where}: "${v.ingredient_name}" appears twice in "${v.recipe_title}"`);
      ok = false;
    }
    if (ok && ingredient) {
      seen.add(pair);
      hasIngredients.add(key(v.recipe_title));
      recipeIngredients.push({
        recipe_title: v.recipe_title,
        ingredient_name: ingredient.name,
        quantity: cents(quantity),
        unit: ingredient.unit,
      });
    }
  }

  for (const r of recipes) {
    if (!hasIngredients.has(key(r.title))) errors.push(`recipe "${r.title}" has no valid ingredient lines in recipe_ingredients.csv`);
  }

  return { catalog: { ingredients, recipes, recipeIngredients }, errors };
}
