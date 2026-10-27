# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

This is a monorepo with no git repository of its own. The enclosing git repo is `/Users/theesoontornsing/Desktop`, so run git commands from there or initialize one here first.

- `apps/mobile/`: Expo app (React Native, TypeScript, Expo Router). Routes live in `src/app/`.
- `supabase/`: database migrations and Edge Functions. There is no `supabase/config.toml` yet, so `supabase init` hasn't been run.
- `apps/web/` (marketing site) and the Stripe and RevenueCat webhooks are planned but not built.

## Commands

Run these from `apps/mobile/`:

```bash
npm install                 # install dependencies
npm run start               # Expo dev server
npm run ios                 # Expo dev server opened on iOS
npm run android             # Expo dev server opened on Android
npx tsc --noEmit            # typecheck (strict mode, extends expo/tsconfig.base)
npx expo-doctor            # diagnose dependency and config issues
npx expo install <pkg>      # add packages; use this instead of npm install so versions match the SDK
```

Lint: `apps/mobile/AGENTS.md` lists `npx expo lint`, but there's no ESLint config and no lint script yet, so it won't work until one is added.

Tests: no test runner is configured yet.

## Expo app architecture

- Expo SDK 58, React 19.3, React Native 0.88, Expo Router (`main` is `expo-router/entry`).
- Routes are file-based under `apps/mobile/src/app/`: `index` (weekly plan), `onboarding`, `grocery`, and `paywall` (presented as a modal). `_layout.tsx` defines the root Stack.
- Screens read and write through `state/AppState.tsx`, which runs on Supabase when configured and signed in, and on example data otherwise. RevenueCat isn't wired up.
- `apps/mobile/AGENTS.md` says Expo APIs change every SDK release. Read the Expo docs for the installed major version before writing Expo or React Native code, rather than relying on memory. Prefer Expo modules over third-party libraries. Use `apps/mobile/CLAUDE.md`, which imports `AGENTS.md`, as the authoritative source for these rules.
- `app.json` sets the app name to Kavi, scheme to `kavi`, and bundle ID to `com.usekavi.app` for both iOS and Android. The splash screen is configured through the `expo-splash-screen` plugin, not a top-level `splash` key, because SDK 58 rejects the top-level key.
- Brand assets are in `apps/mobile/assets/`: `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`, and `shelves/shelf1.png` to `shelf9.png` (glass shelf graphics for UI). The brand green is `#3DAA84`, used for the splash and Android adaptive icon background. The template's `android-icon-*.png` files are no longer referenced.
- `assets/vendor/katex/` holds KaTeX JS and CSS. Nothing in the app uses it yet, and it's not a fit for a meal planner, so check before using it.
- Installing `expo-splash-screen` needed `--legacy-peer-deps` because of a React peer conflict (`react-dom@19.3.1`). Treat that as a known workaround, not a fix.

## Supabase backend

- `supabase/migrations/20260101000000_init.sql` creates the core schema: profiles, ingredients (static price table), recipes, recipe_ingredients, meal_plans, meal_plan_items, pantry_items, household_members, grocery_lists, grocery_items, and subscriptions. Every table has RLS enabled. Catalog tables (ingredients and recipes) are readable by authenticated users, and subscription writes happen only through the service role.
- Edge Functions share code in `supabase/functions/_shared/`: `provider.ts` (the `PlanProvider` interface, the Zod schema, and `parsePlan`, which rejects any recipe ID the model invents), `adapters.ts` (Claude, `claude-sonnet-5-5`; Ollama for local dev; and the built-in `basic` planner), `planner.ts` (the built-in planner: cheaper recipes first, under budget when it can be), `plan-logic.ts` (the pure decision logic: allergy, diet, equipment and meal filters, cost scaling, week validation), `data.ts` (profile and catalog reads) and `http.ts` (JSON responses and a client that acts as the caller). `providerFromEnv` uses Claude when `ANTHROPIC_API_KEY` is set and the free built-in planner otherwise; `KAVI_PLAN_PROVIDER` forces one.
- `generate-plan` reads the caller's profile, enforces one free plan per calendar month (active or trialing subscribers get `SUBSCRIBER_MONTHLY_PLAN_CAP` plan requests a month, 25, counted in `plan_generations`; going over answers `plan_cap` with a 429), picks candidate recipes, asks the provider for a week, validates it (21 meals, breakfast, lunch and dinner on each of 7 days, with dinners all different, lunches used at most twice and breakfasts at most three times), retries a model once and then falls back to the built-in planner, saves it to `meal_plans` and `meal_plan_items`, and builds its grocery list.
- `meal-options` returns swap choices for one meal under the same filters, cheapest first. `delete-account` deletes the caller's auth user with the service role, and every table cascades from `auth.users`.
- Migration `20260104000000_app_backend.sql` adds a profile row for every new auth user, free-text pantry items (`name`, `shelf`, and an `ingredient_id` filled in when the name matches the catalog), and `rebuild_grocery_list(plan_id)`, which sums the week's ingredients scaled to the household, leaves off pantry matches, keeps checked items checked, and records the total and the pantry savings. Applied to the hosted project.
- Equipment: `profiles.appliances` (migration `20260102000000_profile_appliances.sql`, applied to the hosted project) holds the household's appliance ids. Recipes tagged `needs-<appliance>` are only offered to households that have it, and an empty list applies no filter. The app's list is `APPLIANCES` in `apps/mobile/src/data/mock.ts`, collected in the 4-step onboarding (`onboarding/kitchen`) and editable from Settings.
- Meals: a plan is breakfast, lunch and dinner for each day (21 items). `meal_plan_items.meal_type` (migration `20260103000000_meal_type.sql`, applied to the hosted project) records which meal each item is. Recipes carry `breakfast`, `lunch` and/or `dinner` tags and are only offered for those meals; the importer requires at least one. The app models this as 21 slots (`day * 3 + meal order`).
- Allergy filtering honours `contains-<allergen>` recipe tags and also matches ingredient names against word lists in `plan-logic.ts`. Treat the word lists as a safety net, and tag recipes in the CSV for anything that matters.
- The functions and their tests run on Deno: `deno test supabase/functions/_shared/` and `deno check supabase/functions/<name>/index.ts`. Deploy with `supabase functions deploy <name> --use-api --no-verify-jwt` (each function verifies the caller itself). All three are deployed to the hosted project, and the starter catalog is imported.
- Apple and Google sign-in use `signInWithOAuth` in a system browser sheet (`api.signInWithProvider`) and return to `kavi://auth-callback` with a PKCE code. Enable each provider in Supabase Auth → Providers and add the redirect URL under Auth → URL Configuration. Apple needs the Apple Developer Program; Google needs an OAuth web client in Google Cloud.
- iOS bundle id is `com.logicbaker.kavi` (widgets: `com.logicbaker.kavi.widgets`, App Group `group.com.logicbaker.kavi`). App icon has light, dark and tinted variants (`ios.icon` in app.json; PNGs in `apps/mobile/assets/ios-*.png`), plus an Android monochrome icon. The home screen widget is `apps/mobile/widgets/KaviToday.tsx` (expo-widgets); `src/lib/widgets.ts` pushes today's meals and grocery progress to it. Icon variants and widgets only show in a development or store build (`npx expo prebuild`, `npx expo run:ios`), not Expo Go, where the widget code is skipped.
- `supabase/scripts/import-recipes.ts` loads the catalog from three CSVs (format in `supabase/scripts/README.md`). It runs on Node 23.6+ with no dependencies, and `--dry-run` validates without touching the database. Tests: `node --test supabase/scripts/recipe-csv.test.ts`.
- App data: `apps/mobile/src/lib/api.ts` holds every Supabase read and write; `state/AppState.tsx` uses it when Supabase is configured and the user is signed in (email code sign-in), and falls back to the example data in `data/mock.ts` when `.env` has no Supabase keys.
- Not built yet: the RevenueCat and Stripe webhooks, Apple and Google sign-in, and shared households.

## Product context

Kavi is a US meal planner for busy households on a budget. The business model is one free plan per month plus a paid subscription, with Stripe on the web and RevenueCat for in-app purchases. Recipes come from user-supplied CSV data.
