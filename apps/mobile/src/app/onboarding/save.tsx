import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, PrimaryButton } from '../../components/Buttons';
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

  // New accounts see the paywall once, over their first week; someone returning to an existing account goes straight in.
  const enter = () => {
    resetTo('/week');
    if (from !== 'welcome') router.push('/paywall');
  };

  // Nobody signed in: the sign-up and sign-in sheet opens on its own the first time this step appears.
  // Closing it leaves the button below to open it again.
  const openAuth = () => router.push({ pathname: '/auth', params: { from } });
  const asked = useRef(false);
  useEffect(() => {
    if (!app.live || !app.authReady || app.signedIn || asked.current) return;
    asked.current = true;
    openAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.live, app.authReady, app.signedIn]);

  const summary: [string, string][] = [
    ['Diet', dietName],
    ['People', String(app.people)],
    ['Weekly budget', `$${app.budget}`],
    ['Avoiding', avoiding],
    ['Kitchen', kitchen],
  ];

  return (
    <OnboardingShell
      step={4}
      pip="save"
      backLabel={from === 'welcome' ? 'Back to welcome' : 'Back to step 3'}
      title="Save Your Plan"
      intro={
        app.live
          ? 'Check your answers, then save them to an account. You can change any of this later in Settings.'
          : 'This build runs on example data, so nothing is saved yet.'
      }
      footer={
        <>
          {!app.live ? (
            <PrimaryButton
              label="Continue"
              onPress={() => {
                app.signIn();
                enter();
              }}
            />
          ) : app.signedIn ? (
            <PrimaryButton label="Continue" onPress={enter} />
          ) : (
            <PrimaryButton label="Sign Up or Log In" onPress={openAuth} />
          )}
          <AppText variant="footnote" style={styles.center}>
            Kavi uses your account only to save your settings and sync your list.
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
