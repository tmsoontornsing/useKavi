import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, IconButton, PrimaryButton } from '../../components/Buttons';
import { ProgressBar } from '../../components/Controls';
import { TabScreen } from '../../components/TabScreen';
import { Reveal } from '../../motion';
import { useApp } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

export default function Week() {
  const c = useTheme();
  const app = useApp();
  const over = app.planTotal > app.budget;
  const ready = app.planStatus === 'ready';

  const header = (
    <>
      <View style={styles.titleRow}>
        <Image source={require('../../../assets/icon.png')} style={styles.icon} accessibilityIgnoresInvertColors />
        <View>
          <AppText variant="largeTitle" accessibilityRole="header">This Week</AppText>
          <AppText variant="subhead">Oct 27 to Nov 2 · {app.people} people</AppText>
        </View>
      </View>
      {ready ? <Reveal><BudgetCard over={over} /></Reveal> : null}
    </>
  );

  return (
    <TabScreen tab="week" header={header}>
      {app.planStatus === 'loading' ? <LoadingState /> : null}
      {app.planStatus === 'empty' ? (
        <Reveal><View style={styles.centered}>
          <Image source={require('../../../assets/shelves/shelf1.png')} style={styles.shelf} resizeMode="contain" />
          <AppText variant="title" style={styles.center} accessibilityRole="header">No dinners planned yet</AppText>
          <AppText color={c.muted} style={styles.center}>
            Kavi will plan seven dinners for {app.people} people that fit your ${app.budget} budget.
          </AppText>
          <PrimaryButton label="Plan This Week" onPress={app.generatePlan} />
          <AppText variant="footnote">Free plan: 1 of 1 plans left this month</AppText>
        </View></Reveal>
      ) : null}
      {app.planStatus === 'error' ? (
        <Reveal><View style={styles.centered} accessibilityRole="alert">
          <View style={[styles.errorIcon, { backgroundColor: c.warnBg }]}>
            <Ionicons name="cloud-offline-outline" size={26} color={c.warn} />
          </View>
          <AppText variant="title" style={styles.center} accessibilityRole="header">Couldn’t build your plan</AppText>
          <AppText color={c.muted} style={styles.center}>
            Kavi can’t reach the internet. Check your connection and try again. Your household settings are saved.
          </AppText>
          <PrimaryButton label="Try Again" onPress={app.generatePlan} />
        </View></Reveal>
      ) : null}
      {ready
        ? app.plan.map((meal, i) => (
            <Reveal key={meal.day} index={i}>
            <Card style={styles.meal}>
              <AppText variant="eyebrow" style={styles.day}>{meal.day}</AppText>
              <Pressable
                accessibilityRole="link"
                accessibilityHint="Opens the recipe"
                onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: meal.id, day: String(i) } })}
                style={({ pressed }) => [styles.mealText, { opacity: pressed ? 0.6 : 1 }]}
              >
                <AppText variant="headline">{meal.name}</AppText>
                <AppText variant="subhead">{meal.minutes}</AppText>
              </Pressable>
              <View style={styles.cost}>
                <AppText variant="money">${meal.cost}</AppText>
                <AppText style={styles.est} color={c.muted}>est.</AppText>
              </View>
              <IconButton
                icon="swap-horizontal"
                label={`Swap ${meal.name}`}
                onPress={() => router.push({ pathname: '/swap/[day]', params: { day: String(i) } })}
              />
            </Card>
            </Reveal>
          ))
        : null}
    </TabScreen>
  );
}

function BudgetCard({ over }: { over: boolean }) {
  const c = useTheme();
  const { planTotal, budget } = useApp();
  const left = budget - planTotal;
  return (
    <Card style={styles.budget}>
      <View style={styles.budgetHead}>
        <AppText variant="eyebrow">Budget</AppText>
        <AppText style={{ fontVariant: ['tabular-nums'] }}>
          <AppText variant="money" style={{ fontSize: 24 }} color={over ? c.warn : c.text}>${planTotal}</AppText>
          {` of $${budget} · est.`}
        </AppText>
      </View>
      <ProgressBar
        value={planTotal}
        max={budget}
        color={over ? c.warn : c.primary}
        label={`Estimated $${planTotal} of $${budget} budget`}
      />
      {over ? (
        <View style={[styles.warning, { backgroundColor: c.warnBg }]}>
          <Ionicons name="warning-outline" size={18} color={c.warn} />
          <AppText variant="subhead" color={c.warn} weight="500" style={styles.flex}>
            ${-left} over budget. Swap a dinner to get back under.
          </AppText>
        </View>
      ) : (
        <AppText variant="subhead" color={c.primaryText} weight="500">${left} left this week</AppText>
      )}
    </Card>
  );
}

function LoadingState() {
  const c = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse]);

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Building your plan" style={styles.loading}>
      <AppText variant="subhead">Building your plan from 300 recipes…</AppText>
      {['70%', '55%', '80%', '62%', '74%', '58%'].map((w) => (
        <Animated.View key={w} style={[styles.skeleton, { backgroundColor: c.card, opacity: pulse }]}>
          <View style={[styles.bar, { width: 30, height: 12, backgroundColor: c.track }]} />
          <View style={styles.flex}>
            <View style={[styles.bar, { width: w as `${number}%`, height: 14, backgroundColor: c.track }]} />
            <View style={[styles.bar, { width: '30%', height: 10, backgroundColor: c.track }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 9 },
  budget: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  budgetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  warning: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: radius.control },
  meal: {
    borderRadius: radius.row,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  day: { width: 36 },
  mealText: { flex: 1, flexShrink: 1, minWidth: 0, minHeight: 44, justifyContent: 'center', gap: 2 },
  cost: { alignItems: 'flex-end' },
  est: { fontSize: 12 },
  centered: { alignItems: 'center', gap: 14, paddingTop: 24 },
  center: { textAlign: 'center' },
  shelf: { width: '100%', height: 40 },
  errorIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  loading: { gap: 8 },
  skeleton: { height: 64, borderRadius: radius.row, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  bar: { borderRadius: 6 },
});
