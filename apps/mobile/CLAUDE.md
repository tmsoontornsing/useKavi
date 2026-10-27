@AGENTS.md

## Mascot

Pip is Kavi's mascot, a mason jar. Use `<Mascot pose="wave" />` from `src/components/Mascot.tsx`. The 13 poses are wave, think, cook, shop, cheer, oops, sleep, peek, love, yum, save, point and read; each pose's `use` in `mascotPoses.generated.ts` says where it belongs. Each pose plays its own idle animation, which Reduce Motion or `animate={false}` turns off. Draw and edit poses in `scripts/build-mascot.mjs`, then run `node scripts/build-mascot.mjs` to regenerate `assets/mascot/*.svg` and `src/components/mascotPoses.generated.ts`. Do not edit the generated files by hand. Add `tappable` to let people poke Pip (a jump, a squish and a tap of haptics); it is a bonus and never the only way to do anything. In development, `/dev/mascot` shows every pose animating.

Pip is also the app icon, splash screen, and every marketing image. `scripts/build-brand.mjs` draws them from Pip's parts in `scripts/pip-art.mjs` and the generated poses, and writes `assets/icon.png`, the iOS dark and tinted icons, the Android adaptive layers, `assets/splash-icon.png`, `assets/favicon.png`, and everything in `marketing/`. After changing Pip, run `node scripts/build-mascot.mjs && node scripts/build-brand.mjs`. Store listing copy is in `marketing/README.md`.

## Nutrition

Each recipe's calories, protein, carbs, fiber, sugars, fat, saturated fat, cholesterol and sodium are estimated per serving from its ingredients. The figures live in the `ingredient_nutrition` table (per 100 g, plus the grams in one pricing unit), loaded from `supabase/catalog/starter/nutrition.csv` by the import script. `src/lib/nutrition.ts` does the math and the label rounding; `api.ts` attaches `nutrition` to each meal and recipe; `NutritionFacts` shows the recipe's label, and the week shows calories per meal and a per-person total for each day. Example data has no nutrition, so those parts stay hidden there.

## Legal

The Terms of Service and Privacy Policy live in `src/legal/documents.ts`, with business details in `src/legal/config.ts`. The app shows them at `/legal/terms` and `/legal/privacy`; `node scripts/build-legal.mjs` writes the same text to `legal/*.md` for the website. When Kavi starts collecting new data or uses a new service, update the Privacy Policy and the store privacy forms in the same change. `docs/legal-checklist.md` lists what must happen before release. Never describe allergen filtering, prices, or nutrition as guaranteed in UI copy.

## Reminders

The grocery list's checkbox button sends unchecked items to a "Kavi Groceries" list in Apple Reminders (`src/lib/reminders.ts`, using `expo-calendar/legacy`). iOS only; the button is hidden elsewhere. Kavi creates and reads only that list, and skips items already waiting in it, so sending twice does not duplicate. The permission text lives in the `expo-calendar` plugin entry in `app.json` and takes effect in the next native build; Expo Go shows its own wording.

## Widgets

Two home screen widgets live in `widgets/`: Today's Meals (`KaviToday.tsx`) and Grocery List (`KaviGroceries.tsx`), registered in the `expo-widgets` entry of `app.json`. `src/lib/widgets.ts` sends them data whenever the plan or list changes. Widget code runs in an isolated runtime with no hooks and no app imports, and props travel as plain values: send a list as one string joined with "|", not an array. Widgets need a native build (`npx expo run:ios`); Expo Go cannot show them. If a build fails on Desktop with "resource fork, Finder information, or similar detritus not allowed", iCloud is syncing the project; build from a copy outside Desktop and Documents, and run with `LANG=en_US.UTF-8`.
