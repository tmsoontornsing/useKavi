import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import {
  DAYS,
  MEAL_TYPES,
  type ApplianceId,
  type DietId,
  type GroceryAisle,
  type Meal,
  type MealType,
  type PlannedMeal,
  type RecipeDetail,
  type RecipeView,
  type Shelf,
} from '../data/mock';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

// Every read and write the app makes to Supabase. All of it runs as the signed-in user, so row-level
// security limits it to their own household. AppState decides when to call these.

const db = () => {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
};

const check = <T>(result: { data: T; error: { message: string } | null }): T => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

export type Profile = {
  people: number;
  budget: number;
  diet: DietId;
  allergies: string[];
  dislikes: string[];
  appliances: ApplianceId[];
};

// ---- Sign-in: Apple or Google.

export type OAuthProvider = 'apple' | 'google';

// Apple and Google sign in through the provider's own page in a system browser sheet, then return to
// kavi://auth-callback with a one-time code. Returns false when the person closes the sheet.
export async function signInWithProvider(provider: OAuthProvider): Promise<boolean> {
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await db().auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw new Error(error?.message ?? 'Could not start sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const params = new URL(result.url).searchParams;
  const failure = params.get('error_description') ?? params.get('error');
  if (failure) throw new Error(failure);
  const code = params.get('code');
  if (!code) throw new Error('Sign-in did not finish. Try again.');
  const { error: exchangeError } = await db().auth.exchangeCodeForSession(code);
  if (exchangeError) throw new Error(exchangeError.message);
  return true;
}

export async function signOut() {
  await db().auth.signOut();
}

// ---- Profile

// `saved` is false for a profile the sign-up trigger created but the app has not filled in yet.
export async function loadProfile(userId: string): Promise<(Profile & { saved: boolean }) | null> {
  const row = check(
    await db()
      .from('profiles')
      .select('household_size, weekly_budget_usd, diet, allergies, dislikes, appliances')
      .eq('id', userId)
      .maybeSingle(),
  );
  if (!row) return null;
  return {
    people: row.household_size,
    budget: row.weekly_budget_usd === null ? 0 : Number(row.weekly_budget_usd),
    diet: (row.diet ?? 'any') as DietId,
    allergies: row.allergies,
    dislikes: row.dislikes,
    appliances: row.appliances as ApplianceId[],
    saved: row.weekly_budget_usd !== null,
  };
}

export async function saveProfile(userId: string, p: Profile) {
  check(
    await db().from('profiles').upsert({
      id: userId,
      household_size: p.people,
      weekly_budget_usd: p.budget,
      diet: p.diet,
      allergies: p.allergies,
      dislikes: p.dislikes,
      appliances: p.appliances,
    }),
  );
}

// ---- Pantry

const SHELF_ORDER = ['Staples', 'Spices', 'Fridge'];

export async function loadPantry(userId: string): Promise<Shelf[]> {
  const rows = check(await db().from('pantry_items').select('name, shelf').eq('user_id', userId).order('name')) ?? [];
  const shelves = [...SHELF_ORDER, ...new Set(rows.map((r) => r.shelf).filter((s) => !SHELF_ORDER.includes(s)))];
  return shelves.map((name) => ({ name, items: rows.filter((r) => r.shelf === name).map((r) => r.name) }));
}

export async function addPantryItems(userId: string, shelves: Shelf[]) {
  const rows = shelves.flatMap((s) => s.items.map((name) => ({ user_id: userId, shelf: s.name, name })));
  if (rows.length === 0) return;
  const { error } = await db().from('pantry_items').insert(rows);
  // Names are unique per household, ignoring case. An item already on the shelf is not an error.
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function removePantryItem(userId: string, name: string) {
  check(await db().from('pantry_items').delete().eq('user_id', userId).eq('name', name));
}

// ---- Week plan

type RecipeRow = {
  id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  recipe_ingredients: { quantity: number; ingredient: { avg_price_usd: number } | null }[];
};

const needs = (tags: string[]) => tags.filter((t) => t.startsWith('needs-')).map((t) => t.slice('needs-'.length));
const baseCost = (r: RecipeRow) =>
  r.recipe_ingredients.reduce((sum, l) => sum + Number(l.quantity) * Number(l.ingredient?.avg_price_usd ?? 0), 0);

// This week's Monday, or tomorrow's on a Sunday, when people plan the week ahead. Uses the phone's own date.
export function currentWeekStart(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 1 : 1 - day));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "Oct 27 to Nov 2" for a week starting on the given Monday.
export function weekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const fmt = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} to ${fmt(end)}`;
}

// The household's latest plan as 21 slots in order, with costs scaled to the household.
export async function loadWeek(
  userId: string,
  people: number,
): Promise<{ planId: string; weekStart: string; meals: PlannedMeal[] } | null> {
  const plan = check(
    await db()
      .from('meal_plans')
      .select('id, week_start')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  if (!plan) return null;
  const items = check(
    await db()
      .from('meal_plan_items')
      .select(
        'day_of_week, meal_type, recipe:recipes(id, title, minutes, servings, tags, recipe_ingredients(quantity, ingredient:ingredients(avg_price_usd)))',
      )
      .eq('plan_id', plan.id)
      .returns<{ day_of_week: number; meal_type: MealType; recipe: RecipeRow | null }[]>(),
  ) ?? [];
  const meals: PlannedMeal[] = [];
  for (const item of items) {
    if (!item.recipe) continue;
    const slot = (item.day_of_week - 1) * 3 + MEAL_TYPES.indexOf(item.meal_type);
    const [day, dayLong] = DAYS[item.day_of_week - 1];
    meals[slot] = {
      id: item.recipe.id,
      name: item.recipe.title,
      type: item.meal_type,
      minutes: `${item.recipe.minutes} min`,
      cost: Math.round((baseCost(item.recipe) * people) / item.recipe.servings),
      day,
      dayLong,
      slot,
      appliances: needs(item.recipe.tags),
    };
  }
  if (meals.filter(Boolean).length !== 21) throw new Error('This week’s plan is incomplete. Plan the week again.');
  return { planId: plan.id, weekStart: plan.week_start, meals };
}

export async function swapMeal(planId: string, slot: number, recipeId: string) {
  check(
    await db()
      .from('meal_plan_items')
      .update({ recipe_id: recipeId })
      .eq('plan_id', planId)
      .eq('day_of_week', Math.floor(slot / 3) + 1)
      .eq('meal_type', MEAL_TYPES[slot % 3]),
  );
  await rebuildGroceries(planId);
}

// ---- Grocery list

const AISLE_ORDER = ['Produce', 'Meat and Seafood', 'Dairy and Eggs', 'Bakery', 'Pantry', 'Frozen'];
export const formatQuantity = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));

export async function rebuildGroceries(planId: string) {
  check(await db().rpc('rebuild_grocery_list', { p_plan_id: planId }));
}

export async function loadGroceries(planId: string): Promise<{
  aisles: GroceryAisle[];
  checked: Record<string, boolean>;
  total: number;
  pantrySavings: number;
} | null> {
  const list = check(
    await db().from('grocery_lists').select('id, estimated_total_usd, pantry_savings_usd').eq('plan_id', planId).maybeSingle(),
  );
  if (!list) return null;
  const items = check(
    await db()
      .from('grocery_items')
      .select('id, quantity, unit, checked, ingredient:ingredients(name, aisle, avg_price_usd)')
      .eq('list_id', list.id)
      .returns<{ id: string; quantity: number; unit: string; checked: boolean; ingredient: { name: string; aisle: string; avg_price_usd: number } }[]>(),
  ) ?? [];
  const aisleNames = [...AISLE_ORDER, ...new Set(items.map((i) => i.ingredient.aisle).filter((a) => !AISLE_ORDER.includes(a)))];
  const aisles = aisleNames
    .map((name) => ({
      name,
      items: items
        .filter((i) => i.ingredient.aisle === name)
        .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name))
        .map((i) => ({
          key: i.id,
          name: `${i.ingredient.name}, ${formatQuantity(Number(i.quantity))} ${i.unit}`,
          price: Number(i.quantity) * Number(i.ingredient.avg_price_usd),
        })),
    }))
    .filter((a) => a.items.length > 0);
  return {
    aisles,
    checked: Object.fromEntries(items.map((i) => [i.id, i.checked])),
    total: Number(list.estimated_total_usd),
    pantrySavings: Number(list.pantry_savings_usd),
  };
}

export async function setChecked(itemId: string, checked: boolean) {
  check(await db().from('grocery_items').update({ checked }).eq('id', itemId));
}

// ---- Recipes

export async function loadRecipe(
  recipeId: string,
  people: number,
  pantryNames: string[],
  type: MealType,
): Promise<RecipeView | null> {
  const r = check(
    await db()
      .from('recipes')
      .select('id, title, minutes, servings, steps, tags, recipe_ingredients(quantity, unit, ingredient:ingredients(name, avg_price_usd))')
      .eq('id', recipeId)
      .maybeSingle()
      .returns<{
        id: string;
        title: string;
        minutes: number;
        servings: number;
        steps: string;
        tags: string[];
        recipe_ingredients: { quantity: number; unit: string; ingredient: { name: string; avg_price_usd: number } | null }[];
      } | null>(),
  );
  if (!r) return null;
  const scale = people / r.servings;
  const onShelf = new Set(pantryNames.map((n) => n.trim().toLowerCase()));
  const lines = r.recipe_ingredients.filter((l) => l.ingredient);
  const detail: RecipeDetail = {
    serves: people,
    appliances: needs(r.tags) as ApplianceId[],
    ingredients: lines.map((l) => {
      const qty = Number(l.quantity) * scale;
      const name = l.ingredient!.name;
      return {
        name: `${name}, ${formatQuantity(Math.round(qty * 100) / 100)} ${l.unit}`,
        price: onShelf.has(name.toLowerCase()) ? ('pantry' as const) : Math.round(qty * Number(l.ingredient!.avg_price_usd) * 100) / 100,
      };
    }),
    steps: r.steps.split('\n').map((s) => s.trim()).filter(Boolean),
  };
  const cost = lines.reduce((sum, l) => sum + Number(l.quantity) * scale * Number(l.ingredient!.avg_price_usd), 0);
  return { meal: { id: r.id, name: r.title, type, minutes: `${r.minutes} min`, cost: Math.round(cost) }, detail };
}

// ---- Edge Functions

// Calls a function and turns its error responses into a message the app can show.
async function invoke<T>(name: string, body: object): Promise<T> {
  const { data, error } = await db().functions.invoke(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.message ?? 'Something went wrong. Try again.');
    }
    if (error instanceof FunctionsFetchError) {
      throw new Error('Kavi can’t reach the internet. Check your connection and try again.');
    }
    throw new Error('Something went wrong. Try again.');
  }
  return data as T;
}

export const generatePlan = (weekStart: string) => invoke('generate-plan', { week_start: weekStart });

export async function mealOptions(type: MealType, exclude: string[]): Promise<Meal[]> {
  const result = await invoke<{ options: { id: string; title: string; minutes: number; estimated_cost_usd: number }[] }>(
    'meal-options',
    { meal_type: type, exclude },
  );
  return result.options.map((o) => ({
    id: o.id,
    name: o.title,
    type,
    minutes: `${o.minutes} min`,
    cost: Math.round(o.estimated_cost_usd),
  }));
}

export const deleteAccount = () => invoke('delete-account', {});
