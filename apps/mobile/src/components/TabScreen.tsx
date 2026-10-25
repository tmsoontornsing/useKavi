import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { space, useTheme } from '../theme';

// Shared shell for tab screens: a fixed header and scrolling content that clears the native tab bar.
// There is no pinned footer: the floating iOS tab bar would cover it, so totals live in the header.
export function TabScreen({ header, children }: { header: ReactNode; children: ReactNode }) {
  const c = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>{header}</View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 12, gap: 14 },
  content: { paddingHorizontal: space.gutter, paddingBottom: 24, gap: 8 },
});
