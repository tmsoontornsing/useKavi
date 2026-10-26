import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import {
  DAYS,
  DEFAULT_SLOTS,
  GROCERIES,
  MEALS,
  PANTRY,
  RECIPES,
  SWAP_POOL,
  type ApplianceId,
  type DietId,
  type GroceryAisle,
  type Meal,
  type PlannedMeal,
  type RecipeView,
  type Shelf,
} from '../data/mock';
import * as api from '../lib/api';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { syncWidgets } from '../lib/widgets';
import { haptic } from '../motion';

// App state. With Supabase configured (EXPO_PUBLIC_SUPABASE_* in .env), a signed-in household's profile,
// pantry, plan and grocery list load from and save to Supabase. Without it, the app runs on the example
// data in data/mock.ts so every screen can still be tried.

export type PlanStatus = 'ready' | 'loading' | 'empty' | 'error';

type AppState = {
  live: boolean;
  authReady: boolean;
  signedIn: boolean;
  email: string | null;
  people: number;
  budget: number;
  diet: DietId;
  allergies: string[];
  dislikes: string[];
  appliances: ApplianceId[];
  remindSunday: boolean;
  notifyListChanges: boolean;
  subscribed: boolean;
  planStatus: PlanStatus;
  planError: string | null;
  plan: PlannedMeal[];
  planTotal: number;
  weekLabel: string;
  groceries: GroceryAisle[];
  groceryTotal: number;
  pantrySavings: number;
  checked: Record<string, boolean>;
  pantry: Shelf[];
};

type Actions = {
  setPeople: (n: number) => void;
  setBudget: (n: number) => void;
  setDiet: (d: DietId) => void;
  toggleAllergy: (a: string) => void;
  toggleDislike: (d: string) => void;
  toggleAppliance: (id: ApplianceId) => void;
  setRemindSunday: (on: boolean) => void;
  setNotifyListChanges: (on: boolean) => void;
  signInWithProvider: (provider: api.OAuthProvider) => Promise<boolean>;
  signIn: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  subscribe: () => void;
  setPlanStatus: (s: PlanStatus) => void;
  generatePlan: () => void;
  getRecipe: (id: string, slot?: number) => Promise<RecipeView | null>;
  getSwapOptions: (slot: number) => Promise<Meal[]>;
  swapMeal: (slot: number, meal: Meal) => Promise<void>;
  toggleChecked: (key: string) => void;
  addPantryItem: (shelf: string, item: string) => void;
  removePantryItem: (shelf: string, item: string) => void;
};

const Ctx = createContext<(AppState & Actions) | null>(null);

const LIVE = isSupabaseConfigured;

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');

// ---- Example data, used when Supabase is not configured

const demoPlan = (ids: string[]): PlannedMeal[] =>
  ids.map((id, slot) => {
    const [day, dayLong] = DAYS[Math.floor(slot / 3)];
    return { ...MEALS[id], day, dayLong, slot, appliances: RECIPES[id]?.appliances ?? [] };
  });
const DEMO_GROCERIES: GroceryAisle[] = GROCERIES.map((a) => ({
  name: a.name,
  items: a.items.map((i) => ({ key: i.name, ...i })),
}));
const DEMO_GROCERY_TOTAL = GROCERIES.reduce((s, a) => s + a.items.reduce((t, i) => t + i.price, 0), 0);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Household. These start as onboarding defaults; once signed in they mirror the saved profile.
  const [people, setPeopleRaw] = useState(4);
  // Covers all three meals a day, so the default is higher than it was for dinners alone.
  const [budget, setBudgetRaw] = useState(220);
  const [diet, setDiet] = useState<DietId>('any');
  const [allergies, setAllergies] = useState<string[]>(['Peanuts', 'Shellfish']);
  const [dislikes, setDislikes] = useState<string[]>(['Mushrooms']);
  // Most kitchens have these three, so they start ticked and the user unticks what they lack.
  const [appliances, setAppliances] = useState<ApplianceId[]>(['stovetop', 'oven', 'microwave']);
  const [remindSunday, setRemindSunday] = useState(true);
  const [notifyListChanges, setNotifyListChanges] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pantry, setPantry] = useState<Shelf[]>(PANTRY);

  // Account
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!LIVE);
  const [demoSignedIn, setDemoSignedIn] = useState(false);

  // Week. In example mode these start filled in; when live they load after sign-in.
  const [planStatus, setPlanStatus] = useState<PlanStatus>(LIVE ? 'loading' : 'ready');
  const [planError, setPlanError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlannedMeal[]>(LIVE ? [] : demoPlan(DEFAULT_SLOTS));
  const [planId, setPlanId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [groceries, setGroceries] = useState<GroceryAisle[]>(LIVE ? [] : DEMO_GROCERIES);
  const [groceryTotal, setGroceryTotal] = useState(LIVE ? 0 : DEMO_GROCERY_TOTAL);
  const [pantrySavings, setPantrySavings] = useState(LIVE ? 0 : 17.8);
  const [checked, setChecked] = useState<Record<string, boolean>>(
    LIVE ? {} : { 'Bell peppers, 3': true, 'Yellow onions, 3 lb bag': true },
  );

  const userId = session?.user.id ?? null;
  const profile: api.Profile = { people, budget, diet, allergies, dislikes, appliances };
  // Latest values for async work started earlier, so it never acts on stale state.
  const latest = useRef({ profile, pantry, planId });
  latest.current = { profile, pantry, planId };
  // The profile as last saved, so the save effect only writes real changes.
  const savedProfile = useRef<string | null>(null);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(demoTimer.current), []);

  const reloadGroceries = async (id: string) => {
    let list = await api.loadGroceries(id);
    if (!list) {
      await api.rebuildGroceries(id);
      list = await api.loadGroceries(id);
    }
    setGroceries(list?.aisles ?? []);
    setChecked(list?.checked ?? {});
    setGroceryTotal(list?.total ?? 0);
    setPantrySavings(list?.pantrySavings ?? 0);
  };

  const reloadWeek = async (uid: string, householdSize: number) => {
    const week = await api.loadWeek(uid, householdSize);
    if (!week) {
      setPlan([]);
      setPlanId(null);
      setWeekStart(null);
      setGroceries([]);
      setChecked({});
      setGroceryTotal(0);
      setPantrySavings(0);
      setPlanStatus('empty');
      return;
    }
    setPlan(week.meals);
    setPlanId(week.planId);
    setWeekStart(week.weekStart);
    await reloadGroceries(week.planId);
    setPlanError(null);
    setPlanStatus('ready');
  };

  const showError = (e: unknown) => {
    setPlanError(message(e));
    setPlanStatus('error');
  };

  // Follow the Supabase session: restored from the phone on launch, then any sign-in or sign-out.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  // On sign-in, bring the household together: a brand-new account takes what was set up during onboarding,
  // and a returning one loads what it saved before. Then load the week and its grocery list.
  useEffect(() => {
    if (!userId) {
      savedProfile.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      setPlanStatus('loading');
      try {
        const local = latest.current.profile;
        const server = await api.loadProfile(userId);
        let current = local;
        if (server?.saved) {
          current = { people: server.people, budget: server.budget, diet: server.diet, allergies: server.allergies, dislikes: server.dislikes, appliances: server.appliances };
          if (cancelled) return;
          setPeopleRaw(current.people);
          setBudgetRaw(current.budget);
          setDiet(current.diet);
          setAllergies(current.allergies);
          setDislikes(current.dislikes);
          setAppliances(current.appliances);
        } else {
          await api.saveProfile(userId, local);
        }
        savedProfile.current = JSON.stringify(current);

        let shelves = await api.loadPantry(userId);
        if (shelves.every((s) => s.items.length === 0)) {
          await api.addPantryItems(userId, latest.current.pantry);
          shelves = await api.loadPantry(userId);
        }
        if (cancelled) return;
        setPantry(shelves);
        await reloadWeek(userId, current.people);
      } catch (e) {
        if (!cancelled) showError(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Save household changes a moment after they stop, then refresh the plan's costs and grocery list.
  useEffect(() => {
    if (!userId || savedProfile.current === null) return;
    const snapshot = JSON.stringify(profile);
    if (snapshot === savedProfile.current) return;
    const timer = setTimeout(async () => {
      try {
        await api.saveProfile(userId, profile);
        savedProfile.current = snapshot;
        const id = latest.current.planId;
        if (id) {
          await api.rebuildGroceries(id);
          await reloadWeek(userId, profile.people);
        }
      } catch (e) {
        console.warn('Saving the household failed', e);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [userId, people, budget, diet, allergies, dislikes, appliances]);

  // Pantry changes move items on and off the grocery list.
  const refreshListAfterPantryChange = async () => {
    const id = latest.current.planId;
    if (!id) return;
    await api.rebuildGroceries(id);
    await reloadGroceries(id);
  };

  const clearLiveData = () => {
    setPlan([]);
    setPlanId(null);
    setWeekStart(null);
    setGroceries([]);
    setChecked({});
    setPlanStatus('loading');
    setPlanError(null);
  };

  // Keep the home screen widget in step with the plan and the grocery checklist.
  useEffect(() => {
    syncWidgets(plan, groceries, checked);
  }, [plan, groceries, checked]);

  const signedIn = LIVE ? session !== null : demoSignedIn;
  const planTotal = plan.reduce((s, m) => s + m.cost, 0);

  const value: AppState & Actions = {
    live: LIVE,
    authReady,
    signedIn,
    email: session?.user.email ?? null,
    people,
    budget,
    diet,
    allergies,
    dislikes,
    appliances,
    remindSunday,
    notifyListChanges,
    subscribed,
    planStatus,
    planError,
    plan,
    planTotal,
    weekLabel: weekStart ? api.weekLabel(weekStart) : LIVE ? api.weekLabel(api.currentWeekStart()) : 'Oct 27 to Nov 2',
    groceries,
    groceryTotal,
    pantrySavings,
    checked,
    pantry,
    setPeople: (n: number) => setPeopleRaw(Math.min(12, Math.max(1, n))),
    setBudget: (n: number) => setBudgetRaw(Math.min(400, Math.max(50, Math.round(n)))),
    setDiet,
    toggleAllergy: (a: string) => setAllergies((l) => toggle(l, a)),
    toggleDislike: (d: string) => setDislikes((l) => toggle(l, d)),
    toggleAppliance: (id: ApplianceId) =>
      setAppliances((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])),
    setRemindSunday,
    setNotifyListChanges,
    signInWithProvider: (provider: api.OAuthProvider) => api.signInWithProvider(provider),
    // Example mode only. Live sign-in goes through Apple or Google.
    signIn: () => setDemoSignedIn(true),
    signOut: async () => {
      if (LIVE) {
        await api.signOut();
        clearLiveData();
      } else {
        setDemoSignedIn(false);
      }
    },
    deleteAccount: async () => {
      if (LIVE) {
        await api.deleteAccount();
        await api.signOut().catch(() => {});
        clearLiveData();
      } else {
        setDemoSignedIn(false);
      }
    },
    subscribe: () => setSubscribed(true),
    setPlanStatus,
    generatePlan: () => {
      setPlanError(null);
      setPlanStatus('loading');
      if (!LIVE) {
        // Simulates the generate-plan call so the loading state can be seen.
        // A second tap restarts the wait instead of stacking timers.
        if (demoTimer.current) clearTimeout(demoTimer.current);
        demoTimer.current = setTimeout(() => {
          demoTimer.current = undefined;
          setPlan(demoPlan(DEFAULT_SLOTS));
          setPlanStatus('ready');
          haptic.success();
        }, 1500);
        return;
      }
      if (!userId) return;
      api
        .generatePlan(api.currentWeekStart())
        .then(() => reloadWeek(userId, people))
        .then(() => haptic.success())
        .catch(showError);
    },
    getRecipe: async (id: string, slot?: number) => {
      const planned = slot === undefined ? undefined : plan[slot];
      if (!LIVE) {
        const meal = planned ?? (Object.hasOwn(MEALS, id) ? MEALS[id] : undefined);
        if (!meal) return null;
        return { meal, detail: Object.hasOwn(RECIPES, meal.id) ? RECIPES[meal.id] : null };
      }
      const type = planned?.type ?? 'dinner';
      const view = await api.loadRecipe(planned?.id ?? id, people, pantry.flatMap((s) => s.items), type);
      return view && planned ? { ...view, meal: { ...view.meal, cost: planned.cost } } : view;
    },
    getSwapOptions: async (slot: number) => {
      const current = plan[slot];
      if (!current) return [];
      if (!LIVE) {
        // Only offer meals of the same type that the household has the equipment to cook.
        const fits = (id: string) => (RECIPES[id]?.appliances ?? []).every((a) => appliances.includes(a));
        return SWAP_POOL[current.type].filter((id) => id !== current.id && fits(id)).map((id) => MEALS[id]);
      }
      return api.mealOptions(current.type, [current.id]);
    },
    swapMeal: async (slot: number, meal: Meal) => {
      const current = plan[slot];
      if (!current) return;
      // Show the swap right away; when live, the saved week and list replace it a moment later.
      setPlan((p) => p.map((m) => (m.slot === slot ? { ...meal, day: m.day, dayLong: m.dayLong, slot, appliances: LIVE ? [] : RECIPES[meal.id]?.appliances ?? [] } : m)));
      if (!LIVE || !userId || !planId) return;
      try {
        await api.swapMeal(planId, slot, meal.id);
        await reloadWeek(userId, people);
      } catch (e) {
        setPlan((p) => p.map((m) => (m.slot === slot ? current : m)));
        throw e;
      }
    },
    toggleChecked: (key: string) => {
      const next = !checked[key];
      setChecked((c) => ({ ...c, [key]: next }));
      if (LIVE) {
        api.setChecked(key, next).catch(() => setChecked((c) => ({ ...c, [key]: !next })));
      }
    },
    addPantryItem: (shelf: string, item: string) => {
      const exists = pantry.some((s) => s.items.some((i) => i.toLowerCase() === item.toLowerCase()));
      if (exists) return;
      setPantry((p) => p.map((s) => (s.name === shelf ? { ...s, items: [...s.items, item] } : s)));
      if (LIVE && userId) {
        api
          .addPantryItems(userId, [{ name: shelf, items: [item] }])
          .then(refreshListAfterPantryChange)
          .catch((e) => console.warn('Adding to the pantry failed', e));
      }
    },
    removePantryItem: (shelf: string, item: string) => {
      setPantry((p) => p.map((s) => (s.name === shelf ? { ...s, items: s.items.filter((x) => x !== item) } : s)));
      if (LIVE && userId) {
        api
          .removePantryItem(userId, item)
          .then(refreshListAfterPantryChange)
          .catch((e) => console.warn('Removing from the pantry failed', e));
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}
