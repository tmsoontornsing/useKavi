import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { GroceryAisle, PlannedMeal } from '../data/mock';

type TodayWidget = { updateSnapshot: (props: Record<string, unknown>) => void };

// The widget module needs the native widget extension, which exists in development and store builds
// but not in Expo Go. Load it lazily and treat a failure as "no widgets here" so the app still runs.
let today: TodayWidget | null | undefined;
function todayWidget(): TodayWidget | null {
  if (today !== undefined) return today;
  // Checking first (rather than catching the failed import) keeps Expo Go from showing an error overlay.
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return (today = null);
  try {
    today = require('../../widgets/KaviToday').default as TodayWidget;
  } catch {
    today = null;
  }
  return today;
}

// Push today's meals and the grocery progress to the home screen widget.
export function syncWidgets(plan: PlannedMeal[], groceries: GroceryAisle[], checked: Record<string, boolean>) {
  const widget = todayWidget();
  if (!widget) return;
  try {
    // The plan runs Monday to Sunday, three meals a day.
    const day = (new Date().getDay() + 6) % 7;
    const meals = plan.length === 21 ? plan.slice(day * 3, day * 3 + 3) : [];
    const items = groceries.flatMap((a) => a.items);
    widget.updateSnapshot({
      day: meals[0]?.dayLong ?? '',
      breakfast: meals[0]?.name ?? '',
      lunch: meals[1]?.name ?? '',
      dinner: meals[2]?.name ?? '',
      done: items.filter((i) => checked[i.key]).length,
      total: items.length,
    });
  } catch {
    // A widget that can't update must never break the app.
  }
}
