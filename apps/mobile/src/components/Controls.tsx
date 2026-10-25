import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { radius, useTheme } from '../theme';
import { AppText } from './AppText';

export function ProgressBar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color?: string;
  label: string;
}) {
  const c = useTheme();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: Math.min(value, max) }}
      style={[styles.track, { backgroundColor: c.track }]}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color ?? c.primary }]} />
    </View>
  );
}

// Round radio indicator used in diet, plan, and swap choices.
export function RadioDot({ on }: { on: boolean }) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.dot,
        on ? { borderWidth: 7, borderColor: c.primary } : { borderWidth: 2, borderColor: c.control },
      ]}
    />
  );
}

// Reminders-style check circle for grocery rows.
export function CheckCircle({ on }: { on: boolean }) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.check,
        on ? { backgroundColor: c.primary, borderColor: c.primary } : { borderColor: c.control },
      ]}
    >
      {on ? <Ionicons name="checkmark" size={15} color={c.onPrimary} /> : null}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: c.primary, borderColor: c.primary }
          : { backgroundColor: c.card, borderColor: c.control },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <AppText style={{ fontSize: 15, fontWeight: '500' }} color={selected ? c.onPrimary : c.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function KaviSwitch({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
}) {
  const c = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: c.primary, false: c.switchOff }}
      ios_backgroundColor={c.switchOff}
    />
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  dot: { width: 22, height: 22, borderRadius: 11 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
});
