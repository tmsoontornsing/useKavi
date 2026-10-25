import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DAYS, DEFAULT_PLAN, MEALS, PANTRY, type DietId, type PlannedMeal, type Shelf } from '../data/mock';

// In-memory app state for the frontend build. Supabase replaces this later.

export type PlanStatus = 'ready' | 'loading' | 'empty' | 'error';

type AppState = {
  people: number;
  budget: number;
  diet: DietId;
  allergies: string[];
  dislikes: string[];
  remindSunday: boolean;
  notifyListChanges: boolean;
  signedIn: boolean;
  subscribed: boolean;
  planStatus: PlanStatus;
  plan: PlannedMeal[];
  planTotal: number;
  checked: Record<string, boolean>;
  pantry: Shelf[];
};

type Actions = {
  setPeople: (n: number) => void;
  setBudget: (n: number) => void;
  setDiet: (d: DietId) => void;
  toggleAllergy: (a: string) => void;
  toggleDislike: (d: string) => void;
  setRemindSunday: (on: boolean) => void;
  setNotifyListChanges: (on: boolean) => void;
  signIn: () => void;
  signOut: () => void;
  subscribe: () => void;
  setPlanStatus: (s: PlanStatus) => void;
  generatePlan: () => void;
  swapMeal: (dayIndex: number, mealId: string) => void;
  toggleChecked: (item: string) => void;
  addPantryItem: (shelf: string, item: string) => void;
  removePantryItem: (shelf: string, item: string) => void;
};

const Ctx = createContext<(AppState & Actions) | null>(null);

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [people, setPeopleRaw] = useState(4);
  const [budget, setBudgetRaw] = useState(150);
  const [diet, setDiet] = useState<DietId>('any');
  const [allergies, setAllergies] = useState<string[]>(['Peanuts', 'Shellfish']);
  const [dislikes, setDislikes] = useState<string[]>(['Mushrooms']);
  const [remindSunday, setRemindSunday] = useState(true);
  const [notifyListChanges, setNotifyListChanges] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [planStatus, setPlanStatus] = useState<PlanStatus>('ready');
  const [mealIds, setMealIds] = useState<string[]>(DEFAULT_PLAN);
  const [checked, setChecked] = useState<Record<string, boolean>>({
    'Bell peppers, 3': true,
    'Yellow onions, 3 lb bag': true,
  });
  const [pantry, setPantry] = useState<Shelf[]>(PANTRY);
  const planTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(planTimer.current), []);

  const value = useMemo(() => {
    const plan: PlannedMeal[] = mealIds.map((id, i) => ({ ...MEALS[id], day: DAYS[i][0], dayLong: DAYS[i][1] }));
    const planTotal = plan.reduce((s, m) => s + m.cost, 0);
    return {
      people,
      budget,
      diet,
      allergies,
      dislikes,
      remindSunday,
      notifyListChanges,
      signedIn,
      subscribed,
      planStatus,
      plan,
      planTotal,
      checked,
      pantry,
      setPeople: (n: number) => setPeopleRaw(Math.min(12, Math.max(1, n))),
      setBudget: (n: number) => setBudgetRaw(Math.min(400, Math.max(50, Math.round(n)))),
      setDiet,
      toggleAllergy: (a: string) => setAllergies((l) => toggle(l, a)),
      toggleDislike: (d: string) => setDislikes((l) => toggle(l, d)),
      setRemindSunday,
      setNotifyListChanges,
      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
      subscribe: () => setSubscribed(true),
      setPlanStatus,
      // Simulates the generate-plan call so the loading state can be seen.
      // A second tap restarts the wait instead of stacking timers.
      generatePlan: () => {
        if (planTimer.current) clearTimeout(planTimer.current);
        setPlanStatus('loading');
        planTimer.current = setTimeout(() => {
          planTimer.current = undefined;
          setMealIds(DEFAULT_PLAN);
          setPlanStatus('ready');
        }, 1500);
      },
      swapMeal: (dayIndex: number, mealId: string) =>
        setMealIds((ids) => ids.map((id, i) => (i === dayIndex ? mealId : id))),
      toggleChecked: (item: string) => setChecked((c) => ({ ...c, [item]: !c[item] })),
      addPantryItem: (shelf: string, item: string) =>
        setPantry((p) =>
          p.map((s) => (s.name === shelf && !s.items.includes(item) ? { ...s, items: [...s.items, item] } : s)),
        ),
      removePantryItem: (shelf: string, item: string) =>
        setPantry((p) => p.map((s) => (s.name === shelf ? { ...s, items: s.items.filter((x) => x !== item) } : s))),
    };
  }, [people, budget, diet, allergies, dislikes, remindSunday, notifyListChanges, signedIn, subscribed, planStatus, mealIds, checked, pantry]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}
