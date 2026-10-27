import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { IconButton, ProviderButton, TextButton } from '../components/Buttons';
import { EmailAuthForm } from '../components/EmailAuthForm';
import { Mascot } from '../components/Mascot';
import { animateLayout } from '../motion';
import { modalEdges, resetTo } from '../navigation';
import { useApp } from '../state/AppState';
import { space, useTheme } from '../theme';

// Sign up or sign in, as a sheet over Save Your Plan. Closing it leaves the plan answers where they are.
export default function Auth() {
  const c = useTheme();
  const app = useApp();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [emailOpen, setEmailOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New accounts see the paywall once, over their first week; someone returning to an existing account goes straight in.
  // resetTo closes this sheet along with the rest of onboarding.
  const enter = () => {
    resetTo('/week');
    if (from !== 'welcome') router.push('/paywall');
  };

  const withProvider = async (provider: 'apple' | 'google') => {
    setBusy(true);
    setError(null);
    try {
      if (await app.signInWithProvider(provider)) enter();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const withEmail = async (mode: 'signup' | 'signin', email: string, password: string) => {
    if (mode === 'signin') {
      await app.signInWithEmail(email, password);
      enter();
      return 'signed-in' as const;
    }
    const result = await app.signUpWithEmail(email, password);
    if (result === 'signed-in') enter();
    return result;
  };

  const toggleEmail = (open: boolean) => {
    animateLayout();
    setError(null);
    setEmailOpen(open);
  };

  return (
    <SafeAreaView edges={modalEdges} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.top}>
        <IconButton icon="close" label="Close, sign in later" onPress={() => router.back()} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Mascot pose="save" size={emailOpen ? 84 : 120} tappable label="Pip, Kavi's jar, holding a coin" />
          <View style={styles.copy}>
            <AppText variant="largeTitle" accessibilityRole="header" style={styles.center}>
              Save Your Plan
            </AppText>
            <AppText color={c.muted} style={styles.center}>
              Sign in with Apple, Google, or your email so your household settings are saved and your grocery list can be shared.
            </AppText>
          </View>

          <View style={styles.actions}>
            {emailOpen ? (
              <EmailAuthForm onSubmit={withEmail} onBack={() => toggleEmail(false)} />
            ) : (
              <>
                <ProviderButton provider="apple" disabled={busy} onPress={() => withProvider('apple')} />
                <ProviderButton provider="google" disabled={busy} onPress={() => withProvider('google')} />
                <TextButton label="Use email instead" onPress={() => toggleEmail(true)} />
              </>
            )}
            {error ? (
              <AppText variant="subhead" color={c.warn} accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.center}>
                {error}
              </AppText>
            ) : null}
          </View>

          <AppText variant="footnote" style={styles.center}>
            {'By continuing, you agree to the '}
            <AppText variant="footnote" weight="600" color={c.primaryText} accessibilityRole="link" onPress={() => router.push('/legal/terms')}>
              Terms of Service
            </AppText>
            {' and acknowledge the '}
            <AppText variant="footnote" weight="600" color={c.primaryText} accessibilityRole="link" onPress={() => router.push('/legal/privacy')}>
              Privacy Policy
            </AppText>
            . Kavi uses your account only to save your settings and sync your list.
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12, paddingTop: 8 },
  content: { paddingHorizontal: space.gutter, paddingBottom: 24, alignItems: 'center', gap: 18 },
  copy: { gap: 8, alignSelf: 'stretch' },
  center: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10 },
});
