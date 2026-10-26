# Recipe catalog import

Loads ingredients and recipes into Supabase from three CSV files.

```bash
# Check the files without touching the database
node supabase/scripts/import-recipes.ts <folder> --dry-run

# Import (set these in your shell; never commit them or put the key in the app)
export SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service role key>
node supabase/scripts/import-recipes.ts <folder>

# Tests
node --test supabase/scripts/recipe-csv.test.ts
```

Needs Node 23.6 or newer (it runs the `.ts` files directly). `sample-data/` holds seven placeholder
recipes for trying the importer. It is not real catalog data and should not be imported into production.

Re-running is safe. Ingredients are upserted by name (prices update), recipes that already exist by
title are left unchanged, and recipe lines are upserted by recipe and ingredient.

## Files

Header row required, columns in any order, extra columns ignored. Quote any field that contains a comma,
quote, or line break.

**ingredients.csv**: `name, aisle, avg_price_usd, unit`

`unit` is the unit the price is for, e.g. `4.49` per `lb`. Names are unique, ignoring case.

**recipes.csv**: `title, servings, minutes, tags, steps`

`tags` is separated by `|`. `steps` is free text, one step per line.

**recipe_ingredients.csv**: `recipe_title, ingredient_name, quantity, unit`

`unit` must equal the ingredient's pricing unit, so a recipe's cost is exactly the sum of
quantity x price. Convert to that unit when preparing the data.

## Tags the plan function understands

- **Meal** (required): `breakfast`, `lunch`, `dinner`. A recipe is only offered for a meal it is tagged for, and
  can carry several (a soup might be `lunch|dinner`). The importer rejects a recipe with none.
- **Diet**: `vegan`, `vegetarian`, `pescatarian`, `lowcarb`, `halal`. A recipe is only offered to someone
  on a strict diet if it carries a matching tag (a `vegan` recipe also satisfies vegetarian and pescatarian).
  Untagged recipes are offered only to people on "Everything".
- **Allergens**: `contains-peanuts`, `contains-tree-nuts`, `contains-shellfish`, `contains-dairy`,
  `contains-gluten`, `contains-eggs`, `contains-soy`. These are the reliable signal. The function also
  matches ingredient names as a backup, but that list is a safety net, not a guarantee.
- **Dislikes**: `spicy` marks spicy recipes.
- **Equipment**: `needs-<appliance>` for each appliance the recipe requires, using the app's ids:
  `stovetop`, `oven`, `microwave`, `slow-cooker`, `pressure-cooker`, `air-fryer`, `rice-cooker`, `grill`,
  `blender`, `food-processor`. A recipe is only offered to households that have every appliance it needs.
  Untagged recipes need nothing, and a household that has not listed any appliances is not filtered.
  Tag an appliance only when it is truly required, not for optional shortcuts.
