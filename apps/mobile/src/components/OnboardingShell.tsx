import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { space, useTheme } from '../theme';
import { AppText } from './AppText';
import { StepHeader } from './StepHeader';

// Step header, scrolling body, and a footer pinned above the home indicator.
export function OnboardingShell({
  step,
  backLabel,
  title,
  intro,
  children,
  footer,
}: {
  step: 1 | 2 | 3;
  backLabel: string;
  title: string;
  intro: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <StepHeader step={step} backLabel={backLabel} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <AppText variant="largeTitle" accessibilityRole="header">
            {title}
          </AppText>
          <AppText color={c.muted}>{intro}</AppText>
        </View>
        {children}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: c.line }]}>{footer}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 16, gap: 20 },
  intro: { gap: 6 },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
