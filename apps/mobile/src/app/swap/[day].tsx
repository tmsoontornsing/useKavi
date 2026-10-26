import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Card, PrimaryButton, TextButton } from '../../components/Buttons';
import { RadioDot } from '../../components/Controls';
import { MEALS, RECIPES, SWAP_POOL } from '../../data/mock';
import { haptic, PressableScale } from '../../motion';
import { modalEdges } from '../../navigation';
import { useApp } from '../../state/AppState';
import { radius, space, useTheme } from '../../theme';

// Presented as a page sheet: swipe down or tap Cancel to dismiss without changes.
export default function Swap() {
  const c = useTheme();
  const app = useApp();
  // Clamp once so the shown dinner and the swapped dinner are always the same day.
  const raw = Number(useLocalSearchParams<{ day: string }>().day);
  const dayIndex = Number.isInteger(raw) && raw >= 0 && raw < app.plan.length ? raw : 0;
  const current = app.plan[dayIndex];
  // Only offer dinners the household has the equipment to cook.
  const fits = (id: string) => (RECIPES[id]?.appliances ?? []).every((a) => app.appliances.includes(a));
  const options = SWAP_POOL.filter((id) => id !== current.id && fits(id)).map((id) => MEALS[id]);
  const [pick, setPick] = useState(options[0]?.id);
  const chosen = options.find((o) => o.id === pick);
  const newTotal = app.planTotal - current.cost + (chosen?.cost ?? current.cost);

  return (
    <SafeAreaView edges={modalEdges} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <TextButton label="Cancel" bold={false} onPress={() => router.back()} />
        </View>
        <AppText variant="headline" accessibilityRole="header">Swap {current.dayLong}’s Dinner</AppText>
        <View style={styles.side} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.now}>
          <View style={styles.flex}>
            <AppText variant="eyebrow">Now</AppText>
            <AppText variant="headline">{current.name}</AppText>
          </View>
          <AppText variant="money">${current.cost}</AppText>
        </Card>

        <View style={styles.group}>
          <AppText variant="eyebrow" accessibilityRole="header">Swap for</AppText>
          {options.length === 0 ? (
            <Card style={styles.none}>
              <AppText color={c.muted}>No other dinners fit the equipment you ticked.</AppText>
              <TextButton label="Update Kitchen" onPress={() => router.push('/onboarding/kitchen?edit=1')} />
            </Card>
          ) : null}
          <View accessibilityRole="radiogroup" style={styles.group}>
            {options.map((o) => {
              const on = o.id === pick;
              const diff = o.cost - current.cost;
              return (
                <PressableScale
                  key={o.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  to={0.98}
                  onPress={() => {
                    if (!on) haptic.select();
                    setPick(o.id);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: c.card, borderColor: on ? c.primary : 'transparent', opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <RadioDot on={on} />
                  <View style={styles.flex}>
                    <AppText variant="headline">{o.name}</AppText>
                    <AppText variant="subhead">{o.minutes}</AppText>
                  </View>
                  <View style={styles.price}>
                    <AppText variant="money">${o.cost}</AppText>
                    <AppText variant="footnote" weight="600" color={diff <= 0 ? c.primaryText : c.warn}>
                      {diff < 0 ? `Saves $${-diff}` : diff === 0 ? 'Same cost' : `$${diff} more`}
                    </AppText>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.line }]}>
        <View style={styles.totalRow}>
          <AppText variant="subhead">New weekly total</AppText>
          <AppText variant="subhead" color={c.text} style={{ fontVariant: ['tabular-nums'] }}>
            <AppText variant="subhead" weight="700" color={newTotal > app.budget ? c.warn : c.text}>${newTotal}</AppText>
            {` of $${app.budget} · est.`}
          </AppText>
        </View>
        {chosen ? (
          <PrimaryButton
            label="Swap Dinner"
            feedback="success"
            onPress={() => {
              app.swapMeal(dayIndex, chosen.id);
              router.back();
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  side: { flex: 1, alignItems: 'flex-start' },
  content: { paddingHorizontal: space.gutter, paddingVertical: 12, gap: 16 },
  now: { borderRadius: radius.row, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  group: { gap: 8 },
  none: { padding: 16, gap: 4, alignItems: 'flex-start' },
  option: {
    minHeight: 64,
    borderRadius: radius.row,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: { alignItems: 'flex-end', gap: 2 },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 8, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
