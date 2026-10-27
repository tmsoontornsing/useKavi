@AGENTS.md

## Mascot

Pip is Kavi's mascot, a mason jar. Use `<Mascot pose="wave" />` from `src/components/Mascot.tsx`. The 13 poses are wave, think, cook, shop, cheer, oops, sleep, peek, love, yum, save, point and read; each pose's `use` in `mascotPoses.generated.ts` says where it belongs. Each pose plays its own idle animation, which Reduce Motion or `animate={false}` turns off. Draw and edit poses in `scripts/build-mascot.mjs`, then run `node scripts/build-mascot.mjs` to regenerate `assets/mascot/*.svg` and `src/components/mascotPoses.generated.ts`. Do not edit the generated files by hand. Add `tappable` to let people poke Pip (a jump, a squish and a tap of haptics); it is a bonus and never the only way to do anything. In development, `/dev/mascot` shows every pose animating.

Pip is also the app icon, splash screen, and every marketing image. `scripts/build-brand.mjs` draws them from Pip's parts in `scripts/pip-art.mjs` and the generated poses, and writes `assets/icon.png`, the iOS dark and tinted icons, the Android adaptive layers, `assets/splash-icon.png`, `assets/favicon.png`, and everything in `marketing/`. After changing Pip, run `node scripts/build-mascot.mjs && node scripts/build-brand.mjs`. Store listing copy is in `marketing/README.md`.

## Nutrition

Each recipe's calories, protein, carbs, fiber, sugars, fat, saturated fat, cholesterol and sodium are estimated per serving from its ingredients. The figures live in the `ingredient_nutrition` table (per 100 g, plus the grams in one pricing unit), loaded from `supabase/catalog/starter/nutrition.csv` by the import script. `src/lib/nutrition.ts` does the math and the label rounding; `api.ts` attaches `nutrition` to each meal and recipe; `NutritionFacts` shows the recipe's label, and the week shows calories per meal and a per-person total for each day. Example data has no nutrition, so those parts stay hidden there.
