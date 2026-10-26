import { backOr } from '../navigation';
import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '../theme';
import { AppText } from './AppText';
import { IconButton } from './Buttons';

// Back button plus "Step N of 4" progress for the onboarding flow.
export function StepHeader({ step, backLabel }: { step: 1 | 2 | 3 | 4; backLabel: string }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <IconButton icon="chevron-back" label={backLabel} tone="card" onPress={() => backOr('/welcome')} />
      <View style={styles.progress}>
        <AppText variant="footnote">Step {step} of 4</AppText>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${step} of 4`}
          accessibilityValue={{ min: 1, max: 4, now: step }}
          style={styles.segments}
        >
          {[1, 2, 3, 4].map((n) => (
            <View
              key={n}
              style={[styles.segment, { backgroundColor: n <= step ? c.primary : c.track }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  progress: { flex: 1, gap: 6 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: radius.pill },
});
