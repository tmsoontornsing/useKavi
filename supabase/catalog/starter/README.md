# Starter catalog (DRAFT, needs review)

42 dinner recipes, 88 ingredients, 371 recipe lines, drafted so the app and plan function have
something real to run on. **Nothing here has been checked against a store or a nutrition source.**

```bash
node supabase/scripts/import-recipes.ts supabase/catalog/starter --dry-run   # validate
node supabase/scripts/import-recipes.ts supabase/catalog/starter             # import (needs env vars, see ../../scripts/README.md)
```

## Review before importing

- **Prices are rough US averages**, written from general knowledge, not looked up. They drive every
  cost estimate and budget warning, so check or replace them. Edit `avg_price_usd` in `ingredients.csv`;
  re-importing updates prices.
- **Quantities and steps are drafted, not cooked.** Skim them for anything wrong or unclear.
- **Tags were derived from ingredients**, not typed per recipe, so the allergen tags are only as good
  as the properties set for each ingredient:
  - `contains-*` comes from the ingredients (soy sauce counts as soy and gluten; egg noodles as gluten and eggs).
  - `vegan` means no meat, fish, dairy, eggs or honey. `vegetarian` means no meat or fish.
    `pescatarian` means no meat. `lowcarb` means no pasta, rice, bread, tortilla, dough, noodle or potato
    ingredient, matching the "fewer pasta, rice, and bread dinners" wording in the app.
  - `halal` means no pork and no alcohol. It assumes the meat is bought halal. Nothing here checks that.
  - Processed items (broth, salsa, marinara, soy sauce) are assumed free of other allergens. Real
    products vary, so this is a place a human should look.
- Nothing contains peanuts, and only one recipe contains tree nuts, so those two allergies barely filter yet.
- Vegan has only 9 recipes and `vegan + gluten allergy` has exactly 7, so those users will see repeats.
  More vegan dinners are the first thing worth adding.
