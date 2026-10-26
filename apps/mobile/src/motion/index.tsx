import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  useWindowDimensions,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// Motion helpers shared across screens. Every animation here is skipped when the
// system Reduce Motion setting is on, so components never need their own check.

let reduced = false;
AccessibilityInfo.isReduceMotionEnabled().then((v) => {
  reduced = v;
});
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
  reduced = v;
});

export const reduceMotion = () => reduced;

// Haptics fail quietly on devices without a Taptic engine and on Low Power Mode.
const safe = (p: Promise<void>) => p.catch(() => {});
export const haptic = {
  tap: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => safe(Haptics.selectionAsync()),
  success: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};

// Call right before the state change that adds, removes, or resizes rows.
export function animateLayout() {
  if (!reduced) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  // Scale while pressed; closer to 1 for wide rows, smaller for compact controls.
  to?: number;
};

// Pressable that springs down slightly while held.
export function PressableScale({ style, to = 0.97, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const spring = (toValue: number) => {
    if (reduced) return;
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        spring(to);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        spring(1);
        onPressOut?.(e);
      }}
      style={[typeof style === 'function' ? style({ pressed }) : style, { transform: [{ scale }] }]}
    />
  );
}

// Left-to-right order of the tab bar, used to pick which side a screen slides in from.
export type TabName = 'week' | 'groceries' | 'pantry' | 'settings';
const TAB_ORDER: TabName[] = ['week', 'groceries', 'pantry', 'settings'];
let lastTab = -1;

// The native tab bar swaps screens instantly. This slides the incoming screen in from the
// side you are travelling toward, so moving right feels like a swipe left. Spread the
// result onto an Animated.View wrapping the screen's content.
export function useTabSlide(tab: TabName) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const index = TAB_ORDER.indexOf(tab);
      const dir = lastTab < 0 ? 0 : Math.sign(index - lastTab);
      lastTab = index;
      if (reduced || dir === 0) return;
      x.setValue(dir * width * 0.35);
      opacity.setValue(0.3);
      Animated.parallel([
        Animated.timing(x, { toValue: 0, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }, [tab, width, x, opacity]),
  );

  return { opacity, transform: [{ translateX: x }] };
}

// Fades and lifts its content in on mount. Pass the row index to stagger a list.
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 8) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, index]);

  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

// Rocks its content slightly while active, like rearranging icons on the iOS home screen.
export function Wiggle({ active, seed = 0, children }: { active: boolean; seed?: number; children: ReactNode }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduced) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 120 + (seed % 3) * 15, useNativeDriver: true }),
        Animated.timing(t, { toValue: -1, duration: 120 + (seed % 3) * 15, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, seed, t]);

  return (
    <Animated.View style={{ transform: [{ rotate: t.interpolate({ inputRange: [-1, 1], outputRange: ['-1.2deg', '1.2deg'] }) }] }}>
      {children}
    </Animated.View>
  );
}
