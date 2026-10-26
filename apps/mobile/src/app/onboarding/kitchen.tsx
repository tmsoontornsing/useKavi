import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, PrimaryButton } from '../../components/Buttons';
import { CheckCircle } from '../../components/Controls';
import { OnboardingShell } from '../../components/OnboardingShell';
import { APPLIANCES } from '../../data/mock';
import { haptic, PressableScale } from '../../motion';
import { useApp } from '../../state/AppState';
import { useTheme } from '../../theme';

export default function Kitchen() {
  const c = useTheme();
  const { appliances, toggleAppliance } = useApp();
  const { edit } = useLocalSearchParams<{ edit?: string }>();

  return (
    <OnboardingShell
      step={3}
      backLabel={edit ? 'Back to Settings' : 'Back to step 2'}
      title="What’s in Your Kitchen?"
      intro="Tick what you have. Kavi only plans meals you can cook with it."
      footer={
        <PrimaryButton
          label={edit ? 'Done' : 'Continue'}
          onPress={() => (edit ? router.back() : router.push('/onboarding/save'))}
        />
      }
    >
      <Card style={styles.list}>
        <View accessibilityRole="list" accessibilityLabel="Kitchen appliances">
          {APPLIANCES.map((a, i) => {
            const on = appliances.includes(a.id);
            return (
              <PressableScale
                key={a.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={a.name}
                to={0.98}
                onPress={() => {
                  haptic.tap();
                  toggleAppliance(a.id);
                }}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <CheckCircle on={on} />
                <View style={styles.text}>
                  <AppText variant="headline">{a.name}</AppText>
                  {a.detail ? <AppText variant="subhead">{a.detail}</AppText> : null}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </Card>
      <AppText variant="footnote" accessibilityLiveRegion="polite">
        {appliances.length === 0
          ? 'Nothing ticked means Kavi won’t plan around your equipment. You can change this any time in Settings.'
          : `${appliances.length} ticked. You can change this any time in Settings.`}
      </AppText>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { overflow: 'hidden' },
  row: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  text: { flex: 1, gap: 1 },
});
