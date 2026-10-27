// Imports the recipe catalog CSVs into Supabase.
//
//   node supabase/scripts/import-recipes.ts <folder> [--dry-run]
//
// <folder> must hold ingredients.csv, recipes.csv and recipe_ingredients.csv, and may hold nutrition.csv
// (see README.md).
// --dry-run validates the files and prints counts without touching the database.
//
// A real run needs two environment variables. Set them in your shell, not in a file you commit:
//   SUPABASE_URL                e.g. https://<project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   bypasses row-level security. Never put it in the app.
//
// Safe to re-run: ingredients are upserted by name (prices update), recipes already in the database
// are left as they are, recipe_ingredients are upserted by (recipe, ingredient), and nutrition by ingredient.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { key, parseCatalog } from './recipe-csv.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dir = args.find((a) => !a.startsWith('--'));

if (!dir) {
  console.error('Usage: node supabase/scripts/import-recipes.ts <folder> [--dry-run]');
  process.exit(2);
}

// nutrition.csv is optional; the others are required.
const readOptional = (name: string) => {
  try {
    return readFileSync(join(dir, name), 'utf8');
  } catch {
    return undefined;
  }
};

const read = (name: string) => {
  try {
    return readFileSync(join(dir, name), 'utf8');
  } catch {
    console.error(`Cannot read ${join(dir, name)}`);
    process.exit(2);
  }
};

const { catalog, errors } = parseCatalog({
  ingredients: read('ingredients.csv'),
  recipes: read('recipes.csv'),
  recipeIngredients: read('recipe_ingredients.csv'),
  nutrition: readOptional('nutrition.csv'),
});

if (errors.length) {
  console.error(`Found ${errors.length} problem(s). Nothing was imported.\n`);
  for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
  if (errors.length > 50) console.error(`  ...and ${errors.length - 50} more`);
  process.exit(1);
}

console.log(
  `Valid: ${catalog.ingredients.length} ingredients, ${catalog.recipes.length} recipes, ${catalog.recipeIngredients.length} recipe lines, ${catalog.nutrition.length} nutrition rows.`,
);
if (dryRun) {
  console.log('Dry run: nothing was sent to the database.');
  process.exit(0);
}

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell, or use --dry-run.');
  process.exit(2);
}

async function rest<T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: serviceKey!,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      ...(init.prefer ? { prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path.split('?')[0]} failed (${res.status}): ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : []) as T;
}

const chunks = <T>(list: T[], size = 500): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

try {
  // 1. Ingredients: upsert by name, then map name to id.
  const ingredientId = new Map<string, string>();
  for (const part of chunks(catalog.ingredients)) {
    const rows = await rest<{ id: string; name: string }[]>('ingredients?on_conflict=name', {
      method: 'POST',
      body: part,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
    for (const r of rows) ingredientId.set(key(r.name), r.id);
  }

  // 2. Recipes: titles are not unique in the schema, so skip any title that already exists.
  const recipeId = new Map<string, string>();
  for (let offset = 0; ; offset += 1000) {
    const page = await rest<{ id: string; title: string }[]>(`recipes?select=id,title&order=created_at&limit=1000&offset=${offset}`);
    for (const r of page) recipeId.set(key(r.title), r.id);
    if (page.length < 1000) break;
  }
  const fresh = catalog.recipes.filter((r) => !recipeId.has(key(r.title)));
  for (const part of chunks(fresh)) {
    const rows = await rest<{ id: string; title: string }[]>('recipes', {
      method: 'POST',
      body: part,
      prefer: 'return=representation',
    });
    for (const r of rows) recipeId.set(key(r.title), r.id);
  }

  // 3. Recipe lines for every recipe in the file, so a half-finished earlier run heals itself.
  const lines = catalog.recipeIngredients.map((l) => ({
    recipe_id: recipeId.get(key(l.recipe_title))!,
    ingredient_id: ingredientId.get(key(l.ingredient_name))!,
    quantity: l.quantity,
    unit: l.unit,
  }));
  for (const part of chunks(lines)) {
    await rest('recipe_ingredients?on_conflict=recipe_id,ingredient_id', {
      method: 'POST',
      body: part,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
  }

  // 4. Nutrition, one row per ingredient, replaced on every run so corrected figures land.
  const facts = catalog.nutrition.map(({ ingredient_name, ...values }) => ({
    ingredient_id: ingredientId.get(key(ingredient_name))!,
    ...values,
  }));
  for (const part of chunks(facts)) {
    await rest('ingredient_nutrition?on_conflict=ingredient_id', {
      method: 'POST',
      body: part,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
  }

  console.log(
    `Imported: ${ingredientId.size} ingredients, ${fresh.length} new recipes (${catalog.recipes.length - fresh.length} already existed and were left unchanged), ${lines.length} recipe lines, ${facts.length} nutrition rows.`,
  );
} catch (e) {
  console.error(`Import stopped: ${(e as Error).message}`);
  console.error('Re-running is safe: finished steps are upserted, not duplicated.');
  process.exit(1);
}
