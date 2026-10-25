import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '../../theme';

// System tab bar (UITabBar on iOS, Material bottom navigation on Android).
export default function TabsLayout() {
  const c = useTheme();
  return (
    <NativeTabs tintColor={c.primary}>
      <NativeTabs.Trigger name="week">
        <NativeTabs.Trigger.Label>This Week</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="groceries">
        <NativeTabs.Trigger.Label>Groceries</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'cart', selected: 'cart.fill' }} md="shopping_cart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pantry">
        <NativeTabs.Trigger.Label>Pantry</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'cabinet', selected: 'cabinet.fill' }} md="kitchen" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
