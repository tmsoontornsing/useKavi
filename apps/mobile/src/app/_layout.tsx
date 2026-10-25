import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'This week' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Set up Kavi' }} />
        <Stack.Screen name="grocery" options={{ title: 'Grocery list' }} />
        <Stack.Screen name="paywall" options={{ title: 'Kavi Plus', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
