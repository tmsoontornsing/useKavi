import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Card, TextButton } from '../../components/Buttons';
import { applianceName, MEALS, RECIPES, money } from '../../data/mock';
import { backOr } from '../../navigation';
import { useApp } from '../../state/AppState';
import { fonts, radius, space, useTheme } from '../../theme';

// Title-case a dish name for the large heading.
const titleCase = (s: string) => s.replace(/(^|[\s-])(\w)/g, (m) => m.toUpperCase()).replace(/ (And|With) /g, (m) => m.toLowerCase());

export default function Recipe() {
  const c = useTheme();
  const app = useApp();
  const { id, day } = useLocalSearchParams<{ id: string; day?: string }>();
  const dayIndex = Number(day);
  // Opened from a day in the plan, follow that day so a swap updates this screen too.
  const planned = Number.isInteger(dayIndex) ? app.plan[dayIndex] : undefined;
  const meal = planned ?? (Object.hasOwn(MEALS, id) ? MEALS[id] : undefined);
  const detail = meal && Object.hasOwn(RECIPES, meal.id) ? RECIPES[meal.id] : undefined;

  const missing = detail ? detail.appliances.filter((a) => !app.appliances.includes(a)) : [];

  if (!meal) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
        <AppText style={styles.missing}>This recipe isn’t available.</AppText>
      </SafeAreaView>
    );
  }

  const total = detail
    ? detail.ingredients.reduce((s, i) => s + (i.price === 'pantry' ? 0 : i.price), 0)
    : meal.cost;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to This Week"
          onPress={() => backOr('/week')}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={c.primaryText} />
          <AppText color={c.primaryText}>This Week</AppText>
        </Pressable>
        {planned ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/swap/[day]', params: { day: String(dayIndex) } })}
            style={({ pressed }) => [styles.swap, { backgroundColor: c.tint, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="swap-horizontal" size={18} color={c.primaryText} />
            <AppText variant="subhead" weight="600" color={c.primaryText}>Swap Dinner</AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <AppText variant="eyebrow">{planned ? `${planned.dayLong} dinner` : 'Dinner'}</AppText>
          <AppText style={styles.title} accessibilityRole="header">{titleCase(meal.name)}</AppText>
          <View style={styles.pills}>
            {[meal.minutes, `Serves ${detail?.serves ?? 4}`, `${money(total)} est.`].map((p) => (
              <View key={p} style={[styles.pill, { backgroundColor: c.card }]}>
                <AppText variant="subhead" color={c.text} style={{ fontVariant: ['tabular-nums'] }}>{p}</AppText>
              </View>
            ))}
          </View>
        </View>

        {detail ? (
          <>
            <View style={styles.section}>
              <AppText variant="eyebrow" accessibilityRole="header">Equipment</AppText>
              <View style={styles.pills}>
                {detail.appliances.map((id) => {
                  const have = !missing.includes(id);
                  return (
                    <View
                      key={id}
                      accessible
                      accessibilityLabel={`${applianceName(id)}, ${have ? 'in your kitchen' : 'not in your kitchen'}`}
                      style={[styles.equip, { backgroundColor: have ? c.card : c.warnBg }]}
                    >
                      <Ionicons
                        name={have ? 'checkmark-circle' : 'alert-circle'}
                        size={16}
                        color={have ? c.primaryText : c.warn}
                      />
                      <AppText variant="subhead" weight="500" color={have ? c.text : c.warn}>{applianceName(id)}</AppText>
                    </View>
                  );
                })}
              </View>
              {missing.length > 0 ? (
                <View style={styles.missingRow}>
                  <AppText variant="footnote" color={c.warn} style={styles.flex}>
                    {`Your kitchen doesn’t list a ${missing.map((m) => applianceName(m).toLowerCase()).join(' or a ')}.`}
                  </AppText>
                  <TextButton label="Update Kitchen" onPress={() => router.push('/onboarding/kitchen?edit=1')} />
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow" accessibilityRole="header">Ingredients</AppText>
              <Card style={styles.list}>
                {detail.ingredients.map((ing, i) => (
                  <View
                    key={ing.name}
                    style={[styles.ingredient, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}
                  >
                    <AppText style={styles.flex}>{ing.name}</AppText>
                    {ing.price === 'pantry' ? (
                      <View style={[styles.tag, { backgroundColor: c.tint }]}>
                        <AppText variant="footnote" weight="600" color={c.primaryText}>Pantry</AppText>
                      </View>
                    ) : (
                      <AppText variant="subhead" style={{ fontVariant: ['tabular-nums'] }}>{money(ing.price)}</AppText>
                    )}
                  </View>
                ))}
              </Card>
              <AppText variant="footnote">Pantry items cost $0 here because they’re already on your shelf.</AppText>
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow" accessibilityRole="header">Steps</AppText>
              {detail.steps.map((step, i) => (
                <View key={step} style={styles.step}>
                  <View style={[styles.stepNum, { backgroundColor: c.tint }]}>
                    <AppText variant="subhead" weight="700" color={c.primaryText}>{i + 1}</AppText>
                  </View>
                  <AppText style={styles.flex}>{step}</AppText>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Card style={styles.pending}>
            <AppText color={c.muted}>
              Ingredients and steps for this dinner will load from your recipe library once Kavi is connected.
            </AppText>
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
  pending: { padding: 16 },
});
