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
- Every screen is a placeholder right now. Data fetching, Supabase auth, and RevenueCat aren't wired up.
- `apps/mobile/AGENTS.md` says Expo APIs change every SDK release. Read the Expo docs for the installed major version before writing Expo or React Native code, rather than relying on memory. Prefer Expo modules over third-party libraries. Use `apps/mobile/CLAUDE.md`, which imports `AGENTS.md`, as the authoritative source for these rules.
- `app.json` sets the app name to Kavi, scheme to `kavi`, and bundle ID to `com.usekavi.app` for both iOS and Android. The splash screen is configured through the `expo-splash-screen` plugin, not a top-level `splash` key, because SDK 58 rejects the top-level key.
- Brand assets are in `apps/mobile/assets/`: `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`, and `shelves/shelf1.png` to `shelf9.png` (glass shelf graphics for UI). The brand green is `#3DAA84`, used for the splash and Android adaptive icon background. The template's `android-icon-*.png` files are no longer referenced.
- `assets/vendor/katex/` holds KaTeX JS and CSS. Nothing in the app uses it yet, and it's not a fit for a meal planner, so check before using it.
- Installing `expo-splash-screen` needed `--legacy-peer-deps` because of a React peer conflict (`react-dom@19.3.1`). Treat that as a known workaround, not a fix.

## Supabase backend

- `supabase/migrations/20260101000000_init.sql` creates the core schema: profiles, ingredients (static price table), recipes, recipe_ingredients, meal_plans, meal_plan_items, pantry_items, household_members, grocery_lists, grocery_items, and subscriptions. Every table has RLS enabled. Catalog tables (ingredients and recipes) are readable by authenticated users, and subscription writes happen only through the service role.
- `supabase/functions/generate-plan/` is the plan engine. `provider.ts` defines the `PlanProvider` interface, the Zod schema, and `parsePlan`, which rejects any recipe ID the model invents. `adapters.ts` holds the Claude adapter (production, `claude-sonnet-5-5`) and the Ollama adapter (dev, `llama3.1:8b`). `providerFromEnv` picks one from `KAVI_PLAN_PROVIDER`, and falls back to Ollama so dev runs don't call the paid API.
- `index.ts` is the Edge Function entry: it reads the caller's profile, enforces one free plan per calendar month (active or trialing subscribers are unlimited), picks candidate recipes, asks the provider for a week, validates it (seven different recipes on days 1 to 7, with one retry), saves it to `meal_plans` and `meal_plan_items`, and returns the plan with estimated costs. `plan-logic.ts` holds the pure decision logic (allergy and diet filters, cost scaling, week validation) and is unit tested.
- Allergy filtering honours `contains-<allergen>` recipe tags and also matches ingredient names against word lists in `plan-logic.ts`. Treat the word lists as a safety net, and tag recipes in the CSV for anything that matters.
- The Edge Function and its tests run on Deno: `deno test supabase/functions/generate-plan/` and `deno check supabase/functions/generate-plan/index.ts`. The function has not been run against a live database or deployed yet.
- `supabase/scripts/import-recipes.ts` loads the catalog from three CSVs (format in `supabase/scripts/README.md`). It runs on Node 23.6+ with no dependencies, and `--dry-run` validates without touching the database. Tests: `node --test supabase/scripts/recipe-csv.test.ts`.
- Not built yet: the RevenueCat and Stripe webhooks, and the grocery aggregation logic.

## Product context

Kavi is a US meal planner for busy households on a budget. The business model is one free plan per month plus a paid subscription, with Stripe on the web and RevenueCat for in-app purchases. Recipes come from user-supplied CSV data.
