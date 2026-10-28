import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { EstimateNote } from '../../components/EstimateNote';
import { usePlusLabel } from '../../components/PlusLock';
import { Card, IconButton, PrimaryButton, TextButton } from '../../components/Buttons';
import { ProgressBar } from '../../components/Controls';
import { WeekSkeleton } from '../../components/Skeleton';
import { Mascot } from '../../components/Mascot';
import { DayDeck } from '../../components/DayDeck';
import { TabScreen } from '../../components/TabScreen';
import { applianceName, MEAL_LABELS, type PlannedMeal } from '../../data/mock';
import { comma, useT } from '../../i18n';
import { add, labelRound, zero } from '../../lib/nutrition';
import { Reveal, useCountUp } from '../../motion';
import { useApp } from '../../state/AppState';
import { fonts, radius, useTheme } from '../../theme';

export default function Week() {
  const c = useTheme();
  const app = useApp();
  const { t, tn } = useT();
  const over = app.planTotal > app.budget;
  const ready = app.planStatus === 'ready';

  const header = (
    <>
      <View style={styles.titleRow}>
        <Image source={require('../../../assets/icon.png')} style={styles.icon} accessibilityIgnoresInvertColors />
        <View>
          <AppText variant="largeTitle" accessibilityRole="header">{t('This Week')}</AppText>
          <AppText variant="subhead">{`${app.weekLabel} · ${tn(app.people, '{n} person', '{n} people')}`}</AppText>
        </View>
      </View>
      {ready ? <Reveal><BudgetCard over={over} /></Reveal> : null}
    </>
  );

  return (
    <TabScreen tab="week" header={header}>
      {app.planStatus === 'loading' ? <WeekSkeleton /> : null}
      {app.planStatus === 'empty' ? (
        <Reveal><View style={styles.centered}>
          <Mascot pose="sleep" size={150} decorative />
          <AppText variant="title" style={styles.center} accessibilityRole="header">{t('No meals planned yet')}</AppText>
          <AppText color={c.muted} style={styles.center}>
            {tn(
              app.people,
              'Kavi will plan breakfast, lunch, and dinner for {n} person that fit your ${budget} budget.',
              'Kavi will plan breakfast, lunch, and dinner for {n} people that fit your ${budget} budget.',
              { budget: app.budget },
            )}
          </AppText>
          <PrimaryButton label={t('Plan This Week')} onPress={app.generatePlan} />
          <AppText variant="footnote">{t('Free plan: 1 of 1 plans left this month')}</AppText>
          <TextButton label={t('See What Plus Adds')} onPress={() => router.push('/plus')} />
        </View></Reveal>
      ) : null}
      {app.planStatus === 'error' ? (
        <Reveal><View style={styles.centered} accessibilityRole="alert">
          <Mascot pose="oops" size={150} decorative />
          <AppText variant="title" style={styles.center} accessibilityRole="header">{t('Couldn’t build your plan')}</AppText>
          <AppText color={c.muted} style={styles.center}>
            {`${app.planError ?? t('Kavi can’t reach the internet. Check your connection and try again.')} ${t('Your household settings are saved.')}`}
          </AppText>
          <PrimaryButton label={t('Try Again')} onPress={app.generatePlan} />
          {/* api.ts translates its errors, so the free plan error is matched in English and in the language on screen. */}
          {app.planError?.toLowerCase().includes('free plan') || app.planError === t('The free plan includes one plan a month.') ? (
            <TextButton label={t('See What Plus Adds')} onPress={() => router.push('/plus')} />
          ) : null}
        </View></Reveal>
      ) : null}
      {ready && app.plan.length === 21 ? (
        <Reveal>
          <DayDeck
            todayIndex={(new Date().getDay() + 6) % 7}
            initial={(new Date().getDay() + 6) % 7}
            days={Array.from({ length: 7 }, (_, d) => app.plan.slice(d * 3, d * 3 + 3)).map((meals) => ({
              short: meals[0].day,
              long: meals[0].dayLong,
              card: <DayCard meals={meals} />,
            }))}
          />
        </Reveal>
      ) : null}
      {ready && app.plan.length === 21 ? <EstimateNote /> : null}
    </TabScreen>
  );
}

const MEAL_ICON = { breakfast: 'sunny-outline', lunch: 'partly-sunny-outline', dinner: 'moon-outline' } as const;

const openRecipe = (meal: PlannedMeal) =>
  router.push({ pathname: '/recipe/[id]', params: { id: meal.id, slot: String(meal.slot) } });
// Swapping a meal is part of Kavi Plus: free users are taken to what Plus adds instead.
const openSwap = (meal: PlannedMeal, plus: boolean) =>
  plus ? router.push({ pathname: '/swap/[slot]', params: { slot: String(meal.slot) } }) : router.push('/plus');

// Equipment the household lacks, as a warning line, or null when the meal is cookable.
function useMissing(meal: PlannedMeal) {
  const { appliances } = useApp();
  const { t, tx } = useT();
  const needs = meal.appliances
    .filter((a) => !(appliances as string[]).includes(a))
    .map((n) => tx(applianceName(n)).toLowerCase());
  if (needs.length === 0) return null;
  if (needs.length === 1) return t('Needs a {item}', { item: needs[0] });
  return t('Needs a {items} and {last}', { items: needs.slice(0, -1).join(comma()), last: needs[needs.length - 1] });
}

// One day. The day's name leads, with the day's cost and one person's nutrition. Breakfast and lunch sit side by side as
// small tiles; dinner, the meal the day builds toward, gets the full-width row. Today's card is tinted and tagged.
function DayCard({ meals }: { meals: PlannedMeal[] }) {
  const c = useTheme();
  const { subscribed } = useApp();
  const { t, tx, locale } = useT();
  const [breakfast, lunch, dinner] = meals;
  const total = meals.reduce((sum, m) => sum + m.cost, 0);
  // One person's day, shown only when every meal has nutrition data, so a partial total never looks complete.
  const day = meals.every((m) => m.nutrition) ? meals.reduce((d, m) => add(d, m.nutrition!), zero()) : null;
  const isToday = Math.floor(breakfast.slot / 3) === (new Date().getDay() + 6) % 7;

  return (
    <Card style={styles.dayCard}>
      <View style={[styles.dayHead, isToday && { backgroundColor: c.tint }]}>
        <View style={styles.dayTitle}>
          <AppText style={styles.dayName} accessibilityRole="header">{tx(breakfast.dayLong)}</AppText>
          {isToday ? (
            <View style={[styles.todayTag, { backgroundColor: c.primary }]}>
              <AppText variant="footnote" weight="700" color={c.onPrimary}>{t('TODAY')}</AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.dayCost}>
          <AppText variant="money">{`$${total}`}</AppText>
          <AppText variant="footnote">{t('est.')}</AppText>
        </View>
        {day ? (
          <AppText variant="footnote" style={styles.dayNutrition}>
            {subscribed
              ? t('Per person {kcal} cal · {protein} g protein · {sodium} mg sodium', {
                  kcal: labelRound('kcal', day.kcal).toLocaleString(locale),
                  protein: labelRound('protein_g', day.protein_g),
                  sodium: labelRound('sodium_mg', day.sodium_mg).toLocaleString(locale),
                })
              : t('Per person {kcal} cal', { kcal: labelRound('kcal', day.kcal).toLocaleString(locale) })}
          </AppText>
        ) : null}
      </View>

      <View style={styles.pair}>
        <MealTile meal={breakfast} />
        <MealTile meal={lunch} />
      </View>

      {/* No swipe actions on dinner any more: sideways drags now move between days. Recipe and swap have buttons. */}
      <DinnerRow meal={dinner} />
    </Card>
  );
}

// Breakfast or lunch as a compact tile: the dish, a time and calorie line, its cost, and a swap button.
function MealTile({ meal }: { meal: PlannedMeal }) {
  const c = useTheme();
  const { subscribed } = useApp();
  const plusLabel = usePlusLabel();
  const { t, tx, minutes } = useT();
  const missing = useMissing(meal);
  const type = tx(MEAL_LABELS[meal.type]);
  const name = tx(meal.name);
  return (
    <View style={[styles.tile, { backgroundColor: c.tint, borderColor: c.line }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t('{meal}: {name}', { meal: type, name })}
        accessibilityHint={t('Opens the recipe')}
        onPress={() => openRecipe(meal)}
        style={({ pressed }) => [styles.tileBody, { opacity: pressed ? 0.6 : 1 }]}
      >
        <View style={styles.label}>
          <Ionicons name={MEAL_ICON[meal.type]} size={14} color={c.primaryText} />
          <AppText variant="eyebrow" color={c.primaryText}>{type}</AppText>
        </View>
        <AppText variant="headline" numberOfLines={3} style={styles.tileName}>{name}</AppText>
        <AppText variant="footnote" style={{ fontVariant: ['tabular-nums'] }}>
          {meal.nutrition
            ? t('{time} · {kcal} cal', { time: minutes(meal.minutes), kcal: labelRound('kcal', meal.nutrition.kcal) })
            : minutes(meal.minutes)}
        </AppText>
        {missing ? <AppText variant="footnote" weight="600" color={c.warn}>{missing}</AppText> : null}
      </Pressable>
      <View style={styles.tileFoot}>
        <AppText variant="money" style={styles.tileCost}>{`$${meal.cost}`}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={plusLabel(t('Swap {day} {meal}: {name}', { day: tx(meal.dayLong), meal: type.toLowerCase(), name }), subscribed)}
          hitSlop={10}
          onPress={() => openSwap(meal, subscribed)}
          style={({ pressed }) => [styles.tileSwap, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons name={subscribed ? 'swap-horizontal' : 'lock-closed-outline'} size={18} color={c.primaryText} />
        </Pressable>
      </View>
    </View>
  );
}

// Dinner: the day's main meal, in the display face and full width.
function DinnerRow({ meal }: { meal: PlannedMeal }) {
  const c = useTheme();
  const { subscribed } = useApp();
  const plusLabel = usePlusLabel();
  const { t, tx, minutes } = useT();
  const missing = useMissing(meal);
  const type = tx(MEAL_LABELS[meal.type]);
  const name = tx(meal.name);
  return (
    <View style={[styles.dinner, { borderLeftColor: c.primary, backgroundColor: c.card }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t('{meal}: {name}', { meal: type, name })}
        accessibilityHint={t('Opens the recipe')}
        onPress={() => openRecipe(meal)}
        style={({ pressed }) => [styles.dinnerText, { opacity: pressed ? 0.6 : 1 }]}
      >
        <View style={styles.label}>
          <Ionicons name={MEAL_ICON[meal.type]} size={14} color={c.primaryText} />
          <AppText variant="eyebrow" color={c.primaryText}>{type}</AppText>
        </View>
        <AppText style={styles.dinnerName}>{name}</AppText>
        <View style={styles.metaRow}>
          <AppText variant="subhead" style={{ fontVariant: ['tabular-nums'] }}>
            {meal.nutrition
            ? t('{time} · {kcal} cal', { time: minutes(meal.minutes), kcal: labelRound('kcal', meal.nutrition.kcal) })
            : minutes(meal.minutes)}
          </AppText>
          <AppText variant="subhead" color={c.muted}>·</AppText>
          <AppText variant="subhead" weight="600" color={c.primaryText}>{t('Recipe')}</AppText>
          <Ionicons name="chevron-forward" size={13} color={c.primaryText} />
        </View>
        {missing ? <AppText variant="footnote" weight="600" color={c.warn}>{missing}</AppText> : null}
      </Pressable>
      <View style={styles.dinnerSide}>
        <AppText variant="money" style={styles.dinnerCost}>{`$${meal.cost}`}</AppText>
        <IconButton
          icon={subscribed ? 'swap-horizontal' : 'lock-closed-outline'}
          label={plusLabel(t('Swap {day} {meal}: {name}', { day: tx(meal.dayLong), meal: type.toLowerCase(), name }), subscribed)}
          onPress={() => openSwap(meal, subscribed)}
        />
      </View>
    </View>
  );
}

function BudgetCard({ over }: { over: boolean }) {
  const c = useTheme();
  const { planTotal, budget } = useApp();
  const { t } = useT();
  const left = budget - planTotal;
  const shownTotal = Math.round(useCountUp(planTotal));
  // The total is drawn larger, so the sentence is split where it goes.
  const [before, after = ''] = t('{total} of ${budget} · est.', { budget }).split('{total}');
  return (
    <Card style={styles.budget}>
      <View style={styles.budgetHead}>
        <AppText variant="eyebrow">{t('Budget')}</AppText>
        <AppText style={{ fontVariant: ['tabular-nums'] }}>
          {before}
          <AppText variant="money" style={{ fontSize: 24 }} color={over ? c.warn : c.text}>${shownTotal}</AppText>
          {after}
        </AppText>
      </View>
      <ProgressBar
        value={planTotal}
        max={budget}
        color={over ? c.warn : c.primary}
        label={t('Estimated ${total} of ${budget} budget', { total: planTotal, budget })}
      />
      {over ? (
        <View style={[styles.warning, { backgroundColor: c.warnBg }]}>
          <Ionicons name="warning-outline" size={18} color={c.warn} />
          <AppText variant="subhead" color={c.warn} weight="500" style={styles.flex}>
            {t('${amount} over budget. Swap a meal to get back under.', { amount: -left })}
          </AppText>
        </View>
      ) : (
        <View style={styles.underRow}>
          <AppText variant="subhead" color={c.primaryText} weight="500" style={styles.flex}>{t('${amount} left this week', { amount: left })}</AppText>
          <Mascot pose="cheer" size={64} decorative style={styles.cheer} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 9 },
  budget: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  budgetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  warning: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: radius.control },
  dayCard: { borderRadius: radius.row, overflow: 'hidden' },
  dayHead: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', rowGap: 2 },
  dayTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayName: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  todayTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  dayCost: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  dayNutrition: { width: '100%', fontVariant: ['tabular-nums'] },
  pair: { flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  tile: { flex: 1, minWidth: 0, borderRadius: radius.row, borderWidth: 1, padding: 14, gap: 10, justifyContent: 'space-between' },
  tileBody: { gap: 3, minHeight: 84 },
  tileName: { fontFamily: fonts.displaySemi, fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  tileFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileCost: { fontSize: 18 },
  tileSwap: { width: 32, height: 28, alignItems: 'flex-end', justifyContent: 'center' },
  label: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dinner: { paddingTop: 14, paddingBottom: 14, paddingLeft: 12, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 5 },
  dinnerText: { flex: 1, minWidth: 0, gap: 3 },
  dinnerName: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.5 },
  dinnerSide: { alignItems: 'center', gap: 6 },
  dinnerCost: { fontSize: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  centered: { alignItems: 'center', gap: 14, paddingTop: 24 },
  center: { textAlign: 'center' },
  cooking: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  underRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: -14 },
  cheer: { marginRight: -8 },
  bar: { borderRadius: 6 },
});
