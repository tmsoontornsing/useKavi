import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { GroceryAisle, PlannedMeal } from '../data/mock';

type Widget = { updateSnapshot: (props: Record<string, unknown>) => void };

// The widget module needs the native widget extension, which exists in development and store builds
// but not in Expo Go. Load each widget lazily and treat a failure as "no widgets here" so the app still runs.
let loaded: { today: Widget | null; groceries: Widget | null } | undefined;
function widgets() {
  if (loaded) return loaded;
  // Checking first (rather than catching the failed import) keeps Expo Go from showing an error overlay.
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return (loaded = { today: null, groceries: null });
  const load = (get: () => unknown) => {
    try {
      return get() as Widget;
    } catch {
      return null;
    }
  };
  return (loaded = {
    today: load(() => require('../../widgets/KaviToday').default),
    groceries: load(() => require('../../widgets/KaviGroceries').default),
  });
}

// What the largest grocery widget can list. Sending more would only be thrown away.
const GROCERY_ROWS = 18;

// Push today's meals and the grocery list to the home screen widgets.
export function syncWidgets(plan: PlannedMeal[], groceries: GroceryAisle[], checked: Record<string, boolean>) {
  const { today, groceries: list } = widgets();
  if (!today && !list) return;
  try {
    const items = groceries.flatMap((a) => a.items);
    const done = items.filter((i) => checked[i.key]).length;
    if (today) {
      // The plan runs Monday to Sunday, three meals a day.
      const day = (new Date().getDay() + 6) % 7;
      const meals = plan.length === 21 ? plan.slice(day * 3, day * 3 + 3) : [];
      today.updateSnapshot({
        day: meals[0]?.dayLong ?? '',
        breakfast: meals[0]?.name ?? '',
        lunch: meals[1]?.name ?? '',
        dinner: meals[2]?.name ?? '',
        done,
        total: items.length,
      });
    }
    if (list) {
      list.updateSnapshot({
        // Names only: "Avocado, 1 each" becomes "Avocado" so rows stay on one line.
        items: items
          .filter((i) => !checked[i.key])
          .slice(0, GROCERY_ROWS)
          .map((i) => i.name.split(',')[0].replace('|', ' '))
          .join('|'),
        done,
        total: items.length,
      });
    }
  } catch {
    // A widget that can't update must never break the app.
  }
}
