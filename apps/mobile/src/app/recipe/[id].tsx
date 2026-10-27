import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Card, TextButton } from '../../components/Buttons';
import { Mascot } from '../../components/Mascot';
import { NutritionFacts } from '../../components/NutritionFacts';
import { applianceName, MEAL_LABELS, money, type RecipeView } from '../../data/mock';
import { comma, useT } from '../../i18n';
import { animateLayout, haptic, PressableScale, Reveal } from '../../motion';
import { backOr } from '../../navigation';
import { useApp } from '../../state/AppState';
import { fonts, radius, space, useTheme } from '../../theme';

// Title-case a dish name for the large heading. English only; other languages keep the translation's own casing.
const titleCase = (s: string) => s.replace(/(^|[\s-])(\w)/g, (m) => m.toUpperCase()).replace(/ (And|With) /g, (m) => m.toLowerCase());

export default function Recipe() {
  const c = useTheme();
  const app = useApp();
  const { t, tx, line, minutes, midSentence, lang } = useT();
  const { id, slot } = useLocalSearchParams<{ id: string; slot?: string }>();
  const slotIndex = slot !== undefined && Number.isInteger(Number(slot)) ? Number(slot) : undefined;
  // Opened from a slot in the plan, follow that slot so a swap updates this screen too.
  const planned = slotIndex !== undefined ? app.plan[slotIndex] : undefined;
  const recipeId = planned?.id ?? id;

  // undefined while loading, null when the recipe can't be found.
  const [view, setView] = useState<RecipeView | null | undefined>(undefined);
  // Steps ticked off while cooking; a swapped-in recipe starts clean.
  const [doneSteps, setDoneSteps] = useState<Record<number, boolean>>({});
  useEffect(() => setDoneSteps({}), [recipeId]);
  useEffect(() => {
    let cancelled = false;
    setView(undefined);
    app
      .getRecipe(recipeId, slotIndex)
      .then((v) => !cancelled && setView(v))
      .catch(() => !cancelled && setView(null));
    return () => {
      cancelled = true;
    };
    // Reload when the meal in this slot changes, or the household size rescales the quantities.
  }, [recipeId, slotIndex, app.people]);

  const meal = planned ?? view?.meal;
  const detail = view?.detail ?? undefined;
  const missing = detail ? detail.appliances.filter((a) => !app.appliances.includes(a)) : [];

  if (!meal) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
        {view === undefined ? (
          <ActivityIndicator accessibilityLabel={t('Loading recipe')} color={c.primary} style={styles.missing} />
        ) : (
          <AppText style={styles.missing}>{t('This recipe isn’t available.')}</AppText>
        )}
      </SafeAreaView>
    );
  }

  const allDone = !!detail && detail.steps.length > 0 && detail.steps.every((_, i) => doneSteps[i]);

  const total = detail
    ? detail.ingredients.reduce((s, i) => s + (i.price === 'pantry' ? 0 : i.price), 0)
    : meal.cost;
  const missingNames = missing.map((m) => tx(applianceName(m)).toLowerCase());

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Back to This Week')}
          onPress={() => backOr('/week')}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={c.primaryText} />
          <AppText color={c.primaryText}>{t('This Week')}</AppText>
        </Pressable>
        {planned ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/swap/[slot]', params: { slot: String(slotIndex) } })}
            style={({ pressed }) => [styles.swap, { backgroundColor: c.tint, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="swap-horizontal" size={18} color={c.primaryText} />
            <AppText variant="subhead" weight="600" color={c.primaryText}>{t('Swap {meal}', { meal: midSentence(tx(MEAL_LABELS[planned.type])) })}</AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <AppText variant="eyebrow">
            {planned
              ? t('{day} {meal}', { day: tx(planned.dayLong), meal: tx(MEAL_LABELS[planned.type]).toLowerCase() })
              : tx(MEAL_LABELS[meal.type])}
          </AppText>
          <AppText style={styles.title} accessibilityRole="header">
            {lang === 'en' ? titleCase(meal.name) : tx(meal.name)}
          </AppText>
          <View style={styles.pills}>
            {[
              minutes(meal.minutes),
              t('Serves {n}', { n: detail?.serves ?? app.people }),
              t('{amount} est.', { amount: money(total) }),
            ].map((p) => (
              <View key={p} style={[styles.pill, { backgroundColor: c.card }]}>
                <AppText variant="subhead" color={c.text} style={{ fontVariant: ['tabular-nums'] }}>{p}</AppText>
              </View>
            ))}
          </View>
        </View>

        {detail ? (
          <>
            {detail.appliances.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="eyebrow" accessibilityRole="header">{t('Equipment')}</AppText>
              <View style={styles.pills}>
                {detail.appliances.map((id) => {
                  const have = !missing.includes(id);
                  const name = tx(applianceName(id));
                  return (
                    <View
                      key={id}
                      accessible
                      accessibilityLabel={have ? t('{item}, in your kitchen', { item: name }) : t('{item}, not in your kitchen', { item: name })}
                      style={[styles.equip, { backgroundColor: have ? c.card : c.warnBg }]}
                    >
                      <Ionicons
                        name={have ? 'checkmark-circle' : 'alert-circle'}
                        size={16}
                        color={have ? c.primaryText : c.warn}
                      />
                      <AppText variant="subhead" weight="500" color={have ? c.text : c.warn}>{name}</AppText>
                    </View>
                  );
                })}
              </View>
              {missing.length > 0 ? (
                <View style={styles.missingRow}>
                  <AppText variant="footnote" color={c.warn} style={styles.flex}>
                    {missingNames.length === 1
                      ? t('Your kitchen doesn’t list a {item}.', { item: missingNames[0] })
                      : t('Your kitchen doesn’t list a {items} or a {last}.', {
                          items: missingNames.slice(0, -1).join(comma()),
                          last: missingNames[missingNames.length - 1],
                        })}
                  </AppText>
                  <TextButton label={t('Update Kitchen')} onPress={() => router.push('/onboarding/kitchen?edit=1')} />
                </View>
              ) : null}
            </View>
            ) : null}

            <View style={styles.section}>
              <AppText variant="eyebrow" accessibilityRole="header">{t('Ingredients')}</AppText>
              <Card style={styles.list}>
                {detail.ingredients.map((ing, i) => (
                  <View
                    key={ing.name}
                    style={[styles.ingredient, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}
                  >
                    <AppText style={styles.flex}>{line(ing.name)}</AppText>
                    {ing.price === 'pantry' ? (
                      <View style={[styles.tag, { backgroundColor: c.tint }]}>
                        <AppText variant="footnote" weight="600" color={c.primaryText}>{t('Pantry')}</AppText>
                      </View>
                    ) : (
                      <AppText variant="subhead" style={{ fontVariant: ['tabular-nums'] }}>{money(ing.price)}</AppText>
                    )}
                  </View>
                ))}
              </Card>
              <AppText variant="footnote">{t('Pantry items cost $0 here because they’re already on your shelf.')}</AppText>
              {app.allergies.length > 0 ? (
                <AppText variant="footnote" color={c.warn}>
                  {t('Check every label for {allergies}. Products vary by brand, and Kavi can’t guarantee a recipe is allergen-free.', {
                    allergies: app.allergies.map(tx).join(comma()).toLowerCase(),
                  })}
                </AppText>
              ) : null}
            </View>

            {detail.nutrition ? (
              <View style={styles.section}>
                <AppText variant="eyebrow" accessibilityRole="header">{t('Nutrition')}</AppText>
                <NutritionFacts nutrition={detail.nutrition} serves={detail.serves} />
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.stepsHead}>
                <AppText variant="eyebrow" accessibilityRole="header">{t('Steps')}</AppText>
                {allDone ? null : <Mascot pose="read" size={72} decorative tappable style={styles.reader} />}
              </View>
              {detail.steps.map((step, i) => {
                const done = !!doneSteps[i];
                return (
                  <PressableScale
                    key={step}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityHint={t('Marks this step as done')}
                    to={0.98}
                    onPress={() => {
                      haptic.tap();
                      animateLayout();
                      setDoneSteps((d) => ({ ...d, [i]: !d[i] }));
                    }}
                    style={styles.step}
                  >
                    <View style={[styles.stepNum, { backgroundColor: done ? c.primary : c.tint }]}>
                      {done ? (
                        <Ionicons name="checkmark" size={16} color={c.onPrimary} />
                      ) : (
                        <AppText variant="subhead" weight="700" color={c.primaryText}>{i + 1}</AppText>
                      )}
                    </View>
                    <AppText style={[styles.flex, done && styles.stepDone]} color={done ? c.muted : c.text}>{tx(step)}</AppText>
                  </PressableScale>
                );
              })}
              {allDone ? (
                <Reveal lift={12}>
                  <Card style={styles.finished}>
                    <Mascot pose="yum" size={96} decorative tappable />
                    <View style={styles.flex}>
                      <AppText variant="headline">{t('Dinner is ready')}</AppText>
                      <AppText variant="subhead">{t('Every step is done. Enjoy it.')}</AppText>
                    </View>
                  </Card>
                </Reveal>
              ) : null}
            </View>
          </>
        ) : view === undefined ? (
          <ActivityIndicator accessibilityLabel={t('Loading ingredients and steps')} color={c.primary} />
        ) : (
          <Card style={styles.pending}>
            <AppText color={c.muted}>{t('Ingredients and steps for this meal aren’t available yet.')}</AppText>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  missing: { padding: 24 },
  bar: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 8 },
  swap: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6 },
  content: { paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 40, gap: 20 },
  titleBlock: { gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  equip: { paddingLeft: 10, paddingRight: 12, paddingVertical: 7, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6 },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { gap: 8 },
  list: { paddingHorizontal: 16, paddingVertical: 4 },
  ingredient: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepDone: { textDecorationLine: 'line-through' },
  pending: { padding: 16 },
  stepsHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  reader: { marginBottom: -6 },
  finished: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
