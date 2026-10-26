import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { reduceMotion } from '../motion';
import { MASCOT_INFO, MASCOT_POSES, type MascotPose } from './mascotPoses.generated';

export type { MascotPose };

// The generated drawings use these color tokens. Dark mode flips the ink to a light line and the paper fills to the surface color.
const PALETTE = {
  light: { INK: '#13241A', G: '#3DAA84', TINT: '#CFE8DA', GLASS: '#E8F3EC', W: '#FFFFFF' },
  dark: { INK: '#E8F1EB', G: '#5CC99A', TINT: '#2C4A3A', GLASS: '#1F3328', W: '#17231C' },
} as const;

// Kavi, the mason jar. One pose per moment: pick the one that matches what the screen is saying.
// Pass `label` when the pose adds meaning a screen reader needs; leave it off when nearby text already says it
// and the mascot is decoration (pass `decorative`).
export function Mascot({
  pose,
  size = 160,
  label,
  decorative = false,
  animate = true,
  style,
}: {
  pose: MascotPose;
  size?: number;
  label?: string;
  decorative?: boolean;
  // Springs in on mount. Skipped when Reduce Motion is on.
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const dark = useColorScheme() === 'dark';
  const xml = useMemo(() => {
    const colors = PALETTE[dark ? 'dark' : 'light'];
    return MASCOT_POSES[pose].replace(/__([A-Z]+)__/g, (_, k: keyof typeof colors) => colors[k]);
  }, [pose, dark]);

  const pop = useRef(new Animated.Value(animate && !reduceMotion() ? 0 : 1)).current;
  useEffect(() => {
    if (!animate || reduceMotion()) {
      pop.setValue(1);
      return;
    }
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 170, mass: 0.8 }).start();
  }, [pose, animate, pop]);

  return (
    <Animated.View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : (label ?? `Kavi, ${MASCOT_INFO[pose].label.toLowerCase()}`)}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[
        { width: size, height: size },
        { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] },
        style,
      ]}
    >
      <SvgXml xml={xml} width={size} height={size} />
    </Animated.View>
  );
}
