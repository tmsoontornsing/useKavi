import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, PrimaryButton, ProviderButton } from '../../components/Buttons';
import { KaviSwitch } from '../../components/Controls';
import { OnboardingShell } from '../../components/OnboardingShell';
import { applianceName, DIETS } from '../../data/mock';
import { resetTo } from '../../navigation';
import { useApp } from '../../state/AppState';
import { useTheme } from '../../theme';

export default function Save() {
  const c = useTheme();
  const app = useApp();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const dietName = DIETS.find((d) => d.id === app.diet)?.name ?? 'Everything';
  const avoiding = app.allergies.length ? app.allergies.join(', ') : 'Nothing';
  const kitchen = app.appliances.length ? app.appliances.map(applianceName).join(', ') : 'Nothing yet';

  // Sign-in with Apple or Google.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const withProvider = (provider: 'apple' | 'google') =>
    run(async () => {
      if (await app.signInWithProvider(provider)) resetTo('/week');
    });

  const summary: [string, string][] = [
    ['Diet', dietName],
    ['People', String(app.people)],
    ['Weekly budget', `$${app.budget}`],
    ['Avoiding', avoiding],
    ['Kitchen', kitchen],
  ];

  const liveFooter = (
    <>
      <ProviderButton provider="apple" disabled={busy} onPress={() => withProvider('apple')} />
      <ProviderButton provider="google" disabled={busy} onPress={() => withProvider('google')} />
    </>
  );

  return (
    <OnboardingShell
      step={4}
      backLabel={from === 'welcome' ? 'Back to welcome' : 'Back to step 3'}
      title="Save Your Plan"
      intro={
        app.live
          ? 'Sign in with Apple or Google so your household settings are saved and your grocery list can be shared.'
          : 'This build runs on example data, so nothing is saved yet.'
      }
      footer={
        <>
          {app.live ? (
            liveFooter
          ) : (
            <PrimaryButton
              label="Continue"
              onPress={() => {
                app.signIn();
                resetTo('/week');
              }}
            />
          )}
          {error ? (
            <AppText variant="subhead" color={c.warn} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <AppText variant="footnote" style={styles.center}>
            Kavi only uses your account to save settings and sync your list.
          </AppText>
        </>
      }
    >
      <Card style={styles.summary}>
        {summary.map(([k, v], i) => (
          <View
            key={k}
            style={[styles.summaryRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}
          >
            <AppText>{k}</AppText>
            <AppText color={c.muted} style={styles.value} numberOfLines={2}>{v}</AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.remind}>
        <View style={styles.flex}>
          <AppText variant="headline">Sunday reminder</AppText>
          <AppText variant="subhead">
            A note at 5 PM when next week’s plan is ready. iOS asks for permission when you turn this on.
          </AppText>
        </View>
        <KaviSwitch label="Sunday reminder" value={app.remindSunday} onValueChange={app.setRemindSunday} />
      </Card>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  summary: { paddingHorizontal: 16, paddingVertical: 4 },
  summaryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  value: { flexShrink: 1, textAlign: 'right' },
  remind: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  center: { textAlign: 'center', paddingBottom: 4 },
});
