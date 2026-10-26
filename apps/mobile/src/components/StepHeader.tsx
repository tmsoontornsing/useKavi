import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { backOr } from '../navigation';
import { haptic, reduceMotion } from '../motion';
import { fonts, radius, useTheme } from '../theme';
import { AppText } from './AppText';
import { IconButton } from './Buttons';

const TABS = [
  { label: 'Diet', path: '/onboarding/diet' },
  { label: 'Household', path: '/onboarding/household' },
  { label: 'Kitchen', path: '/onboarding/kitchen' },
  { label: 'Save', path: '/onboarding/save' },
] as const;

// The tab the person just left. Each question is its own screen, so the new screen reads this on mount
// and slides the indicator across from there.
let slideFrom: number | null = null;

// Switch to another question in place. Replacing (not pushing) keeps one screen on the stack,
// so any tab can be tapped in any order without building up history. Editing from Settings keeps its `edit` flag.
export function goToStep(from: number, to: number, edit?: string) {
  slideFrom = from;
  router.replace(`${TABS[to - 1].path}${edit ? '?edit=1' : ''}` as Href);
}

// Back button plus the four onboarding questions as tabs. One indicator slides from the tab you left to the one you're on.
export function StepHeader({ step, backLabel }: { step: 1 | 2 | 3 | 4; backLabel: string }) {
  const c = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [width, setWidth] = useState(0);
  const tabWidth = width / TABS.length;

  const position = useRef(new Animated.Value((slideFrom ?? step) - 1)).current;
  useEffect(() => {
    slideFrom = null;
    if (reduceMotion()) {
      position.setValue(step - 1);
      return;
    }
    Animated.spring(position, { toValue: step - 1, damping: 22, stiffness: 260, mass: 0.9, useNativeDriver: true }).start();
  }, [step, position]);

  const translateX = position.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth),
  });

  // Back goes to the previous question; from the first it leaves onboarding (or Settings when editing).
  const back = () => {
    if (edit || step === 1) backOr('/welcome');
    else goToStep(step, step - 1);
  };

  return (
    <View style={styles.row}>
      <IconButton icon="chevron-back" label={backLabel} tone="card" onPress={back} />
      <View
        accessibilityRole="tablist"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.tabs, { borderBottomColor: c.line }]}
      >
        {TABS.map((tab, i) => {
          const n = i + 1;
          const active = n === step;
          return (
            <Pressable
              key={tab.label}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label}, step ${n} of 4`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active) return;
                haptic.select();
                goToStep(step, n, edit);
              }}
              style={styles.tab}
            >
              <AppText
                numberOfLines={1}
                color={active ? c.primaryText : c.text}
                style={{ fontFamily: active ? fonts.displaySemi : undefined, fontSize: 15 }}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
        {width > 0 ? (
          <Animated.View
            style={[styles.indicator, { width: tabWidth, backgroundColor: c.primary, transform: [{ translateX }] }]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  tabs: { flex: 1, flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },
  indicator: { position: 'absolute', left: 0, bottom: -StyleSheet.hairlineWidth, height: 3, borderRadius: radius.pill },
});
