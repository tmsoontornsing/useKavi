import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, PrimaryButton } from '../../components/Buttons';
import { RadioDot } from '../../components/Controls';
import { OnboardingShell } from '../../components/OnboardingShell';
import { goToStep } from '../../components/StepHeader';
import { DIETS } from '../../data/mock';
import { useApp } from '../../state/AppState';
import { useTheme } from '../../theme';

export default function Diet() {
  const c = useTheme();
  const { diet, setDiet } = useApp();
  const { edit } = useLocalSearchParams<{ edit?: string }>();

  return (
    <OnboardingShell
      step={1}
      backLabel={edit ? 'Back to Settings' : 'Back to welcome'}
      title="How Does Your Household Eat?"
      intro="Pick the one that fits most meals. You can change it later in Settings."
      footer={
        <PrimaryButton
          label={edit ? 'Done' : 'Continue'}
          onPress={() => (edit ? router.back() : goToStep(1, 2))}
        />
      }
    >
      <Card style={styles.list}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Diet">
          {DIETS.map((d, i) => {
            const on = diet === d.id;
            return (
              <Pressable
                key={d.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setDiet(d.id)}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.text}>
                  <AppText variant="headline">{d.name}</AppText>
                  <AppText variant="subhead">{d.detail}</AppText>
                </View>
                <RadioDot on={on} />
              </Pressable>
            );
          })}
        </View>
      </Card>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { overflow: 'hidden' },
  row: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, gap: 2 },
});
