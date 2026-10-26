import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptic, PressableScale } from '../motion';
import { fonts, radius, useTheme } from '../theme';
import { AppText } from './AppText';

type IconName = ComponentProps<typeof Ionicons>['name'];

const pressed = (p: boolean): ViewStyle => ({ opacity: p ? 0.7 : 1 });

// feedback: the haptic on press. Use 'success' when the press completes a task, 'none' to stay silent.
export function PrimaryButton({
  label,
  onPress,
  style,
  feedback = 'tap',
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  feedback?: 'tap' | 'success' | 'none';
}) {
  const c = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      to={0.97}
      onPress={() => {
        if (feedback !== 'none') haptic[feedback]();
        onPress();
      }}
      style={({ pressed: p }) => [styles.primary, { backgroundColor: c.primary }, pressed(p), style]}
    >
      <AppText style={{ fontFamily: fonts.displaySemi, fontSize: 17 }} color={c.onPrimary}>
        {label}
      </AppText>
    </PressableScale>
  );
}

export function TextButton({
  label,
  onPress,
  color,
  bold = true,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  bold?: boolean;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={4}
      style={({ pressed: p }) => [styles.text, pressed(p)]}
    >
      <AppText weight={bold ? '600' : '400'} color={color ?? c.primaryText}>
        {label}
      </AppText>
    </Pressable>
  );
}

// Square 44pt icon button with a tinted background. Always needs a screen reader label.
export function IconButton({
  icon,
  label,
  onPress,
  tone = 'tint',
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'tint' | 'card';
}) {
  const c = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      to={0.9}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={({ pressed: p }) => [
        styles.icon,
        { backgroundColor: tone === 'tint' ? c.tint : c.card },
        pressed(p),
      ]}
    >
      <Ionicons name={icon} size={20} color={tone === 'tint' ? c.primaryText : c.text} />
    </PressableScale>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.card }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { minHeight: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
