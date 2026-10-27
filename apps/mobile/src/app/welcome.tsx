import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { PrimaryButton, TextButton } from '../components/Buttons';
import { Mascot } from '../components/Mascot';
import { PantryDrift } from '../components/PantryDrift';
import { WeekJar } from '../components/WeekJar';
import { fonts, useTheme } from '../theme';

// A sample week for 3 vegetarians on $95: each day's dinner, and what that whole day costs.
const EXAMPLE = [
  { day: 'Mon', meal: 'Chickpea shakshuka', cost: 12 },
  { day: 'Tue', meal: 'Peanut noodle bowls', cost: 11 },
  { day: 'Wed', meal: 'Stuffed sweet potatoes', cost: 13 },
  { day: 'Thu', meal: 'Veggie fried rice', cost: 10 },
  { day: 'Fri', meal: 'Black bean quesadillas', cost: 14 },
  { day: 'Sat', meal: 'Mushroom risotto', cost: 12 },
  { day: 'Sun', meal: 'Lentil shepherd’s pie', cost: 9 },
];

export default function Welcome() {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <PantryDrift />
      <ScrollView contentContainerStyle={styles.content}>
        <Mascot pose="wave" size={120} label="Pip, Kavi's jar, waving hello" style={styles.pip} />
        <View style={styles.copy}>
          <AppText style={styles.hero} accessibilityRole="header">
            Every meal of the week, inside your grocery budget.
          </AppText>
          <AppText color={c.muted}>
            Tell Kavi who you cook for and what you spend. It plans the week and builds the grocery list.
          </AppText>
        </View>

        <WeekJar
          title="Example week · 3 people, vegetarian"
          days={EXAMPLE}
          budget={95}
          label="Example week for 3 vegetarian people. Seven dinners, each day's meals adding up to $81 of a $95 budget, $14 to spare."
        />
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
  content: { padding: 24, paddingTop: 8, paddingBottom: 16, gap: 22 },
  pip: { marginLeft: -14, marginBottom: -18, marginTop: -8 },
  copy: { gap: 12 },
  hero: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, letterSpacing: -1 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, gap: 4 },
  center: { textAlign: 'center' },
});
