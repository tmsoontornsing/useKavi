import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Card, IconButton, PrimaryButton } from '../components/Buttons';
import { CheckCircle, ProgressBar } from '../components/Controls';
import { Mascot, type MascotPose } from '../components/Mascot';
import { PLANS } from '../data/mock';
import { useT } from '../i18n';
import { haptic, PressableScale, reduceMotion, Reveal, useCountUp } from '../motion';
import { backOr } from '../navigation';
import { useApp } from '../state/AppState';
import { fonts, radius, space, useTheme } from '../theme';

const annual = PLANS.find((p) => p.id === 'annual')!;

// The Free plan's door to Plus. Each benefit shows itself working instead of describing it: the weeks fill in, a swap
// moves the budget, a shared list ticks over. Opens from Settings and from a spent free plan.
export default function Plus() {
  const c = useTheme();
  const app = useApp();
  const { t, tx } = useT();

  // What stays free, kept short so it reads at a glance.
  const keeps = [
    t('Meals inside your budget'),
    t('Diet and allergy filters'),
    t('Foods you like'),
    t('Kitchen-aware recipes'),
    t('Nutrition on every recipe'),
    t('A list that skips your pantry'),
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <IconButton icon="chevron-back" label={t('Back to Settings')} tone="card" onPress={() => backOr('/settings')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.hero}>
            <Mascot pose="cheer" size={124} tappable label={t('Pip, Kavi\'s jar, cheering')} style={styles.pip} />
            <View style={styles.heroText}>
              <AppText variant="eyebrow" color={c.primaryText}>Kavi Plus</AppText>
              <AppText style={styles.headline} accessibilityRole="header">
                {app.subscribed ? t('You have everything.') : t('A plan for every week.')}
              </AppText>
            </View>
          </View>
          <AppText color={c.muted} style={styles.lede}>
            {app.subscribed
              ? t('Thanks for supporting Kavi. Here is what your plan includes.')
              : t('Free gives you one plan a month. Plus gives you the next week whenever you are ready.')}
          </AppText>
        </Reveal>

        <Reveal index={1}>
          <WeekGrid />
        </Reveal>

        <Reveal index={2}>
          <Benefit
            title={t('Swap any meal, watch the budget move')}
            body={t('Change a dinner and the week’s total and your grocery list follow.')}
            pose="point"
          >
            <SwapDemo />
          </Benefit>
        </Reveal>

        <Reveal index={3}>
          <Benefit
            title={t('Share the list with everyone at home')}
            body={t('Invite the people you shop with. They see the same list and check things off as they go.')}
            pose="shop"
          >
            <ShareDemo />
          </Benefit>
        </Reveal>

        <Reveal index={4}>
          <View style={styles.keeps}>
            <AppText style={styles.sectionTitle} accessibilityRole="header">{t('Included free')}</AppText>
            <View style={styles.pills}>
              {keeps.map((k) => (
                <View key={k} style={[styles.pill, { backgroundColor: c.tint }]}>
                  <Ionicons name="checkmark" size={15} color={c.primaryText} accessibilityElementsHidden />
                  <AppText variant="subhead" color={c.text}>{k}</AppText>
                </View>
              ))}
            </View>
          </View>
        </Reveal>
      </ScrollView>

      {app.subscribed ? null : (
        <View style={[styles.footer, { borderTopColor: c.line, backgroundColor: c.bg }]}>
          <View style={styles.priceRow}>
            <View style={styles.flex}>
              <AppText style={styles.price}>{t('{price} a year', { price: `$${annual.price}` })}</AppText>
              <AppText variant="footnote">{t('About {price} a month, billed yearly', { price: '$4.92' })}</AppText>
            </View>
            <Pulse>
              <View style={[styles.save, { backgroundColor: c.badge }]}>
                <AppText variant="footnote" weight="700" color={c.badgeText}>{tx(annual.badge)}</AppText>
              </View>
            </Pulse>
          </View>
          <Nudge>
            <PrimaryButton label={t('Get Kavi Plus')} feedback="success" onPress={() => router.push('/paywall')} />
          </Nudge>
          <AppText variant="footnote" style={styles.center}>
            {Platform.OS === 'ios'
              ? t('Cancel any time in your App Store settings.')
              : t('Cancel any time in your Google Play settings.')}
          </AppText>
        </View>
      )}
    </SafeAreaView>
  );
}

// One benefit: its title and one line, a small Pip, and the live demo underneath.
function Benefit({ title, body, pose, children }: { title: string; body: string; pose: MascotPose; children: ReactNode }) {
  return (
    <Card style={styles.benefit}>
      <View style={styles.benefitHead}>
        <View style={styles.flex}>
          <AppText style={styles.benefitTitle} accessibilityRole="header">{title}</AppText>
          <AppText variant="subhead">{body}</AppText>
        </View>
        <Mascot pose={pose} size={64} decorative style={styles.benefitPip} />
      </View>
      {children}
    </Card>
  );
}

// Four weeks of a month. Free fills the first and locks the rest; Plus fills all four, one after another with a tick of
// haptics each, then a buzz when the month is full. Tap the card to watch it again.
function WeekGrid() {
  const c = useTheme();
  const { t } = useT();
  const fills = useRef([0, 1, 2, 3].map(() => new Animated.Value(reduceMotion() ? 1 : 0))).current;
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduceMotion()) {
      fills.forEach((v) => v.setValue(1));
      return;
    }
    fills.forEach((v) => v.setValue(0));
    const timers = fills.map((v, i) =>
      setTimeout(() => {
        haptic.select();
        Animated.spring(v, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 170, mass: 0.8 }).start();
      }, 700 + i * 360),
    );
    timers.push(setTimeout(() => haptic.success(), 700 + fills.length * 360));
    return () => timers.forEach(clearTimeout);
  }, [run, fills]);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('Free plans one week of a month. Plus plans every week. Replay the animation.')}
      to={0.985}
      onPress={() => {
        haptic.tap();
        setRun((r) => r + 1);
      }}
    >
      <Card style={styles.grid}>
        <AppText style={styles.benefitTitle} accessibilityRole="header">{t('Every week, not once a month')}</AppText>
        <View style={styles.weekLabels}>
          <View style={styles.rowLabel} />
          {[1, 2, 3, 4].map((n) => (
            <AppText key={n} variant="footnote" style={styles.weekLabel}>{t('Week {n}', { n })}</AppText>
          ))}
        </View>

        <View style={styles.gridRow}>
          <AppText style={styles.rowLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t('Free')}</AppText>
          {[0, 1, 2, 3].map((i) =>
            i === 0 ? (
              <View key={i} style={[styles.cell, { backgroundColor: c.control, borderColor: c.control }]}>
                <Ionicons name="checkmark" size={18} color={c.card} />
              </View>
            ) : (
              <View key={i} style={[styles.cell, styles.locked, { borderColor: c.control }]}>
                <Ionicons name="lock-closed-outline" size={15} color={c.muted} />
              </View>
            ),
          )}
        </View>

        <View style={styles.gridRow}>
          <AppText style={[styles.rowLabel, { color: c.primaryText }]}>Plus</AppText>
          {fills.map((v, i) => (
            <View key={i} style={[styles.cell, { backgroundColor: c.tint, borderColor: c.primary }]}>
              <Animated.View
                style={[styles.fill, { backgroundColor: c.primary, transformOrigin: '0% 50%', transform: [{ scaleX: v }] }]}
              />
              <Animated.View style={{ opacity: v }}>
                <Ionicons name="checkmark" size={18} color={c.onPrimary} />
              </Animated.View>
            </View>
          ))}
        </View>

        <AppText variant="footnote" style={styles.replay}>{t('Tap to replay')}</AppText>
      </Card>
    </PressableScale>
  );
}

// A made-up week: swapping the dinner changes the total. Cycles on its own, or tap to swap now. Names are content keys,
// shown with tx().
// i18n: content
const SWAPS = [
  { name: 'Veggie quesadillas', cost: 12, total: 159 },
  { name: 'Black bean soup', cost: 9, total: 156 },
];
const EXAMPLE_BUDGET = 400;

function SwapDemo() {
  const c = useTheme();
  const { t, tx } = useT();
  const [i, setI] = useState(0);
  const settle = useRef(new Animated.Value(1)).current;
  const total = useCountUp(SWAPS[i].total);

  // Restarts the timer after every swap, so a tap is not followed straight away by an automatic one.
  useEffect(() => {
    if (reduceMotion()) return;
    const id = setTimeout(() => setI((x) => (x + 1) % SWAPS.length), 3200);
    return () => clearTimeout(id);
  }, [i]);

  useEffect(() => {
    if (reduceMotion()) return;
    settle.setValue(0);
    Animated.spring(settle, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 190 }).start();
  }, [i, settle]);

  const meal = SWAPS[i];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('Example: dinner is {meal}, {cost} dollars. Tap to swap it.', { meal: tx(meal.name), cost: meal.cost })}
      to={0.98}
      onPress={() => {
        haptic.tap();
        setI((x) => (x + 1) % SWAPS.length);
      }}
      style={[styles.demo, { backgroundColor: c.bg }]}
    >
      <AppText variant="eyebrow" style={styles.example}>{t('Example · tap to swap')}</AppText>
      <View style={styles.demoRow}>
        <Animated.View
          style={[
            styles.flex,
            { opacity: settle, transform: [{ translateY: settle.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
          ]}
        >
          <AppText variant="eyebrow" color={c.primaryText}>{t('Dinner')}</AppText>
          <AppText style={styles.demoMeal}>{tx(meal.name)}</AppText>
        </Animated.View>
        <AppText variant="money" style={styles.demoCost}>{`$${meal.cost}`}</AppText>
        <View style={[styles.swapIcon, { backgroundColor: c.tint }]}>
          <Ionicons name="swap-horizontal" size={20} color={c.primaryText} />
        </View>
      </View>
      <View style={styles.demoTotal}>
        <AppText variant="subhead" color={c.text} style={styles.nums}>
          {t('Week total {total} of {budget}', { total: `$${Math.round(total)}`, budget: `$${EXAMPLE_BUDGET}` })}
        </AppText>
        <ProgressBar
          value={Math.round(total)}
          max={EXAMPLE_BUDGET}
          label={t('Example week total {total} of {budget} dollars', { total: meal.total, budget: EXAMPLE_BUDGET })}
        />
      </View>
    </PressableScale>
  );
}

// A made-up shared list: someone at home checks things off while you watch. Cycles on its own, or tap to tick the next.
// Items are content keys, shown with tx().
// i18n: content
const SHARED = ['Avocado', 'Basil', 'Carrots', 'Bananas'];

function ShareDemo() {
  const c = useTheme();
  const { t, tx } = useT();
  const [n, setN] = useState(1);

  useEffect(() => {
    if (reduceMotion()) return;
    const id = setTimeout(() => setN((x) => (x >= SHARED.length ? 0 : x + 1)), 1700);
    return () => clearTimeout(id);
  }, [n]);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('Example shared grocery list. Tap to check off the next item.')}
      to={0.98}
      onPress={() => {
        haptic.tap();
        setN((x) => (x >= SHARED.length ? 0 : x + 1));
      }}
      style={[styles.demo, { backgroundColor: c.bg }]}
    >
      <AppText variant="eyebrow" style={styles.example}>{t('Example · tap to check off')}</AppText>
      {SHARED.map((item, idx) => {
        const done = idx < n;
        return (
          <View key={item} style={styles.shareRow}>
            <CheckCircle on={done} />
            <AppText style={[styles.flex, done && styles.struck]} color={done ? c.muted : c.text}>{tx(item)}</AppText>
          </View>
        );
      })}
      <AppText variant="footnote" weight="600" color={c.primaryText} style={styles.sam}>
        {n > 0 ? t('Sam just checked off {item}', { item: tx(SHARED[n - 1]) }) : t('Sam is out shopping…')}
      </AppText>
    </PressableScale>
  );
}

// Breathes slowly, so the saving badge draws the eye without shouting.
function Pulse({ children }: { children: ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion()) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

// A single small bounce once the page has settled, to point at the button.
function Nudge({ children }: { children: ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const nudge = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.04, duration: 160, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 6, stiffness: 220 }),
    ]).start();
  }, [scale]);
  useEffect(() => {
    if (reduceMotion()) return;
    const id = setTimeout(nudge, 3200);
    return () => clearTimeout(id);
  }, [nudge]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  center: { textAlign: 'center' },
  nums: { fontVariant: ['tabular-nums'] },
  bar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: 'row' },
  content: { paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 24, gap: 18 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  pip: { marginLeft: -12 },
  heroText: { flex: 1, gap: 4 },
  headline: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.8 },
  lede: { fontSize: 17, lineHeight: 24, marginTop: 4 },
  grid: { padding: 16, gap: 10 },
  benefitTitle: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  weekLabels: { flexDirection: 'row', gap: 6, marginTop: 2 },
  weekLabel: { flex: 1, textAlign: 'center' },
  // Wide enough for "Gratuit" or "मुफ़्त"; longer words shrink to fit rather than push the cells.
  rowLabel: { width: 64, fontFamily: fonts.displaySemi, fontSize: 16 },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cell: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  locked: { borderStyle: 'dashed' },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  replay: { textAlign: 'center', marginTop: 2 },
  benefit: { padding: 16, gap: 12 },
  benefitHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitPip: { marginVertical: -6, marginRight: -4 },
  demo: { borderRadius: radius.card, padding: 14, gap: 10 },
  example: { fontSize: 11 },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  demoMeal: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  demoCost: { fontSize: 20 },
  swapIcon: { width: 40, height: 40, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  demoTotal: { gap: 6 },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 34 },
  struck: { textDecorationLine: 'line-through' },
  sam: { marginTop: 2 },
  keeps: { gap: 10 },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingLeft: 9, paddingRight: 12, borderRadius: radius.pill },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.5 },
  save: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
});
