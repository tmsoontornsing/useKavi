import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, useFonts } from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { LanguageProvider } from '../i18n';
import { AppStateProvider } from '../state/AppState';
import { useTheme } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const c = useTheme();
  const [loaded, error] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <LanguageProvider>
    <AppStateProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding/diet" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding/household" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding/kitchen" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding/save" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="swap/[slot]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="plus" />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="legal/[doc]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="language" options={{ presentation: 'modal' }} />
      </Stack>
    </AppStateProvider>
    </LanguageProvider>
  );
}
