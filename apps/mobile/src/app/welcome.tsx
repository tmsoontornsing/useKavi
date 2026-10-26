import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Card, PrimaryButton, TextButton } from '../components/Buttons';
import { ProgressBar } from '../components/Controls';
import { fonts, useTheme } from '../theme';

const EXAMPLE = [
  ['Breakfast', 'Overnight oats', '$4'],
  ['Lunch', 'Turkey and avocado wraps', '$10'],
  ['Dinner', 'Sheet-pan chicken fajitas', '$16'],
];

export default function Welcome() {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={require('../../assets/icon.png')} style={styles.icon} accessibilityLabel="Kavi" />
        <View style={styles.copy}>
          <AppText style={styles.hero} accessibilityRole="header">
            Every meal of the week, inside your grocery budget.
          </AppText>
          <AppText color={c.muted}>
            Tell Kavi who you cook for and what you spend. It plans the week and builds the grocery list.
          </AppText>
        </View>

        <Card style={styles.example}>
          <View style={styles.exampleHead}>
            <AppText variant="eyebrow">Example week, 4 people</AppText>
            <AppText variant="subhead" color={c.text}>
              <AppText variant="money" style={{ fontSize: 20 }}>$206</AppText> of $220
            </AppText>
          </View>
          <ProgressBar value={206} max={220} label="Example week, $206 of $220" />
          {EXAMPLE.map(([label, name, cost]) => (
            <View key={label} style={styles.exampleRow}>
              <AppText variant="subhead" color={c.text} style={styles.exampleName}>
                <AppText variant="subhead" color={c.muted}>{label}  </AppText>
                {name}
              </AppText>
              <AppText variant="subhead" style={{ fontVariant: ['tabular-nums'] }}>{cost}</AppText>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Get Started" onPress={() => router.push('/onboarding/diet')} />
        <TextButton label="I Already Have an Account" onPress={() => router.push('/onboarding/save?from=welcome')} />
        <AppText variant="footnote" style={styles.center}>
          No account needed until you save your first plan.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, paddingTop: 24, gap: 28 },
  icon: { width: 72, height: 72, borderRadius: 18 },
  copy: { gap: 12 },
  hero: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, letterSpacing: -1 },
  example: { padding: 16, gap: 12 },
  exampleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  exampleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  exampleName: { flexShrink: 1 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, gap: 4 },
  center: { textAlign: 'center' },
});
