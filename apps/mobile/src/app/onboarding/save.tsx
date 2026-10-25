import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card } from '../../components/Buttons';
import { KaviSwitch } from '../../components/Controls';
import { OnboardingShell } from '../../components/OnboardingShell';
import { DIETS } from '../../data/mock';
import { resetTo } from '../../navigation';
import { useApp } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

export default function Save() {
  const c = useTheme();
  const app = useApp();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const dietName = DIETS.find((d) => d.id === app.diet)?.name ?? 'Everything';
  const avoiding = app.allergies.length ? app.allergies.join(', ') : 'Nothing';

  // Placeholder sign-in: the real build uses AppleAuthenticationButton and Google sign-in through Supabase.
  const finish = () => {
    app.signIn();
    resetTo('/week');
  };

  const summary: [string, string][] = [
    ['Diet', dietName],
    ['People', String(app.people)],
    ['Weekly budget', `$${app.budget}`],
    ['Avoiding', avoiding],
  ];

  return (
    <OnboardingShell
      step={3}
      backLabel={from === 'welcome' ? 'Back to welcome' : 'Back to step 2'}
      title="Save Your Plan"
      intro="Sign in so your household settings are saved and your grocery list can be shared."
      footer={
        <>
          <Pressable
            accessibilityRole="button"
            onPress={finish}
            style={({ pressed }) => [styles.signIn, { backgroundColor: c.appleBg, opacity: pressed ? 0.8 : 1 }]}
          >
            <AppText style={styles.appleText} color={c.appleText}>Sign in with Apple</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={finish}
            style={({ pressed }) => [
              styles.signIn,
              { backgroundColor: c.card, borderColor: c.control, borderWidth: 1.5, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <AppText variant="headline">Continue with Google</AppText>
          </Pressable>
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
  signIn: { minHeight: 52, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  appleText: { fontSize: 19, fontWeight: '600' },
  center: { textAlign: 'center', paddingBottom: 4 },
});
