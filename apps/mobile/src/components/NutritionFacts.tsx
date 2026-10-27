import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { labelRound, percentDV, type NutrientKey, type ServingNutrition } from '../lib/nutrition';
import { reduceMotion, useCountUp } from '../motion';
import { fonts, radius, useTheme } from '../theme';
import { AppText } from './AppText';
import { Card } from './Buttons';

// The label rows, in the order a US Nutrition Facts label lists them. Indented rows are part of the row above.
const ROWS: { key: NutrientKey; label: string; unit: 'g' | 'mg'; indent?: boolean }[] = [
  { key: 'fat_g', label: 'Total fat', unit: 'g' },
  { key: 'sat_fat_g', label: 'Saturated fat', unit: 'g', indent: true },
  { key: 'cholesterol_mg', label: 'Cholesterol', unit: 'mg' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'carbs_g', label: 'Total carbs', unit: 'g' },
  { key: 'fiber_g', label: 'Fiber', unit: 'g', indent: true },
  { key: 'sugar_g', label: 'Total sugars', unit: 'g', indent: true },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
];

// FDA guidance: 20% of the Daily Value or more in one serving is high. Flagged for the ones to limit.
const LIMIT: NutrientKey[] = ['sat_fat_g', 'cholesterol_mg', 'sodium_mg'];

// Per-serving nutrition for a recipe: calories, where they come from, and the label rows with % Daily Value.
export function NutritionFacts({ nutrition, serves }: { nutrition: ServingNutrition; serves: number }) {
  const c = useTheme();
  const n = nutrition.perServing;
  const kcal = Math.round(useCountUp(labelRound('kcal', n.kcal)));

  // Share of calories from each macro, at 4 kcal per gram of protein and carbs and 9 per gram of fat.
  const parts = [
    { label: 'Protein', kcal: n.protein_g * 4, color: c.primary },
    { label: 'Carbs', kcal: n.carbs_g * 4, color: c.badge },
    { label: 'Fat', kcal: n.fat_g * 9, color: c.control },
  ];
  const sum = parts.reduce((s, p) => s + p.kcal, 0) || 1;

  return (
    <Card style={styles.card}>
      <View style={styles.head} accessible accessibilityLabel={`${labelRound('kcal', n.kcal)} calories per serving`}>
        <AppText style={[styles.kcal, { color: c.text }]}>{kcal}</AppText>
        <AppText variant="subhead">calories per serving</AppText>
      </View>

      <View
        accessible
        accessibilityLabel={`Calories from ${parts.map((p) => `${p.label.toLowerCase()} ${Math.round((p.kcal / sum) * 100)}%`).join(', ')}`}
        style={styles.split}
      >
        <View style={[styles.bar, { backgroundColor: c.track }]}>
          {parts.map((p, i) => (
            <Segment key={p.label} share={p.kcal / sum} color={p.color} index={i} />
          ))}
        </View>
        <View style={styles.legend}>
          {parts.map((p) => (
            <View key={p.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: p.color }]} />
              <AppText variant="footnote" color={c.text}>
                {`${p.label} ${Math.round((p.kcal / sum) * 100)}%`}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View>
        <View style={[styles.row, styles.rowHead, { borderBottomColor: c.text }]}>
          <AppText variant="footnote" weight="600" color={c.text} style={styles.flex}>Amount per serving</AppText>
          <AppText variant="footnote" weight="600" color={c.text}>% Daily Value</AppText>
        </View>
        {ROWS.map((r, i) => {
          const amount = labelRound(r.key, n[r.key]);
          const pct = percentDV(r.key, n[r.key]);
          const high = pct !== null && pct >= 20 && LIMIT.includes(r.key);
          return (
            <View
              key={r.key}
              accessible
              accessibilityLabel={`${r.label}, ${amount} ${r.unit === 'g' ? 'grams' : 'milligrams'}${pct !== null ? `, ${pct}% of daily value` : ''}${high ? ', high' : ''}`}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}
            >
              <AppText
                variant="subhead"
                color={c.text}
                weight={r.indent ? undefined : '600'}
                style={[styles.flex, r.indent && styles.indent]}
              >
                {r.label}
                <AppText variant="subhead" color={c.muted}>{`  ${amount} ${r.unit}`}</AppText>
              </AppText>
              {pct !== null ? (
                <AppText variant="subhead" weight="600" color={high ? c.warn : c.text} style={styles.nums}>
                  {`${pct}%`}
                </AppText>
              ) : null}
            </View>
          );
        })}
      </View>

      <AppText variant="footnote">
        {`Estimated from the ingredients, for one of ${serves} servings. % Daily Value is based on 2,000 calories a day.`}
        {nutrition.missing.length ? ` Not counted, no data yet: ${nutrition.missing.join(', ').toLowerCase()}.` : ''}
      </AppText>
    </Card>
  );
}

// One macro's slice of the bar. It grows from nothing, the three one after another.
function Segment({ share, color, index }: { share: number; color: string; index: number }) {
  const grow = useRef(new Animated.Value(reduceMotion() ? share : 0)).current;
  useEffect(() => {
    if (reduceMotion()) {
      grow.setValue(share);
      return;
    }
    // flexGrow can't run on the native driver; it is three small views, animated once.
    Animated.timing(grow, {
      toValue: share,
      duration: 420,
      delay: 120 + index * 110,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [share, index, grow]);
  return <Animated.View style={{ flexGrow: grow, flexBasis: 0, backgroundColor: color }} />;
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14 },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  kcal: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  split: { gap: 8 },
  bar: { height: 10, borderRadius: radius.pill, overflow: 'hidden', flexDirection: 'row', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  row: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowHead: { minHeight: 28, borderBottomWidth: 2, alignItems: 'flex-end', paddingBottom: 4 },
  indent: { paddingLeft: 16 },
  nums: { fontVariant: ['tabular-nums'] },
});
