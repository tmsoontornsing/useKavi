import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Card, IconButton, PrimaryButton } from '../components/Buttons';
import { Mascot } from '../components/Mascot';
import { PLANS } from '../data/mock';
import { Reveal } from '../motion';
import { backOr } from '../navigation';
import { useApp } from '../state/AppState';
import { fonts, radius, space, useTheme } from '../theme';

// What Plus adds, in the same words as the plan sheet so the two never disagree.
const ADDS = [
  { title: 'A new plan every week', body: 'Plan breakfast, lunch, and dinner for the next week as soon as you want it, not once a month.' },
  { title: 'Swap any meal and watch the budget update', body: 'Change a meal and the week’s total and your grocery list follow, so you stay under budget while you shop around the plan.' },
  { title: 'Share the grocery list with everyone at home', body: 'Invite the people you shop with. They see the same list and can check items off as they go.' },
];

// Everything the free plan already includes.
const KEEPS = [
  'Breakfast, lunch, and dinner planned for your household',
  'Meals kept inside your weekly budget',
  'Your diet, allergies, dislikes, and the foods you like',
  'Only recipes your kitchen can cook',
  'Nutrition for every recipe, with calories, sodium, and more',
  'A grocery list that leaves out what is in your pantry',
];

const annual = PLANS.find((p) => p.id === 'annual')!;
const monthly = PLANS.find((p) => p.id === 'monthly')!;

// The Free plan's door to Plus: what you get, what you keep, and the price. Opens from Settings and from a spent free plan.
export default function Plus() {
  const c = useTheme();
  const app = useApp();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <IconButton icon="chevron-back" label="Back to Settings" tone="card" onPress={() => backOr('/settings')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.hero}>
            <Mascot pose="cheer" size={120} tappable label="Pip, Kavi's jar, cheering" style={styles.pip} />
            <View style={styles.heroText}>
              <AppText variant="eyebrow">Kavi Plus</AppText>
              <AppText variant="largeTitle" accessibilityRole="header">
                {app.subscribed ? 'You have everything' : 'A plan for every week'}
              </AppText>
              <AppText color={c.muted}>
                {app.subscribed
                  ? 'Thanks for supporting Kavi. This is what your plan includes.'
                  : 'The free plan covers one plan a month. Plus covers all of them.'}
              </AppText>
            </View>
          </View>
        </Reveal>

        <Reveal index={1}>
          <Card style={styles.compare}>
            <View style={styles.side}>
              <AppText variant="eyebrow">Free</AppText>
              <AppText style={styles.big}>1</AppText>
              <AppText variant="subhead">plan a month</AppText>
            </View>
            <Ionicons name="arrow-forward" size={22} color={c.primaryText} accessibilityElementsHidden />
            <View style={[styles.side, styles.plusSide, { backgroundColor: c.tint }]}>
              <AppText variant="eyebrow" color={c.primaryText}>Plus</AppText>
              <AppText style={[styles.big, { color: c.primaryText }]}>Every</AppText>
              <AppText variant="subhead" color={c.text}>week</AppText>
            </View>
          </Card>
        </Reveal>

        <Reveal index={2}>
          <View style={styles.section}>
            <AppText variant="eyebrow" accessibilityRole="header">What Plus adds</AppText>
            <View style={styles.list}>
              {ADDS.map((a) => (
                <View key={a.title} style={styles.add}>
                  <AppText variant="headline">{a.title}</AppText>
                  <AppText variant="subhead">{a.body}</AppText>
                </View>
              ))}
            </View>
          </View>
        </Reveal>

        <Reveal index={3}>
          <View style={styles.section}>
            <AppText variant="eyebrow" accessibilityRole="header">What stays free</AppText>
            <Card style={styles.keeps}>
              {KEEPS.map((k, i) => (
                <View
                  key={k}
                  style={[styles.keep, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}
                >
                  <Ionicons name="checkmark" size={18} color={c.primaryText} accessibilityElementsHidden />
                  <AppText style={styles.flex}>{k}</AppText>
                </View>
              ))}
            </Card>
          </View>
        </Reveal>

        {app.subscribed ? null : (
          <Reveal index={4}>
            <View style={styles.price}>
              <AppText style={styles.priceBig}>{`$${annual.price} a year`}</AppText>
              <AppText variant="subhead">
                {`That is about $4.92 a month, ${annual.badge.toLowerCase()} against paying $${monthly.price} each month.`}
              </AppText>
            </View>
          </Reveal>
        )}
      </ScrollView>

      {app.subscribed ? null : (
        <View style={[styles.footer, { borderTopColor: c.line }]}>
          <PrimaryButton label="See Plans" onPress={() => router.push('/paywall')} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  bar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: 'row' },
  content: { paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 28, gap: 28 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroText: { flex: 1, gap: 6 },
  pip: { marginLeft: -12 },
  compare: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  side: { flex: 1, borderRadius: radius.row, padding: 14, gap: 2 },
  plusSide: { alignItems: 'flex-start' },
  big: { fontFamily: fonts.display, fontSize: 38, lineHeight: 44, letterSpacing: -1 },
  section: { gap: 10 },
  list: { gap: 16 },
  add: { gap: 2 },
  keeps: { paddingHorizontal: 16, paddingVertical: 4 },
  keep: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  price: { gap: 4 },
  priceBig: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
