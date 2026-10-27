import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Card, PrimaryButton, TextButton } from '../../components/Buttons';
import { RadioDot } from '../../components/Controls';
import { Mascot } from '../../components/Mascot';
import { MEAL_LABELS, type Meal } from '../../data/mock';
import { useT } from '../../i18n';
import { haptic, PressableScale } from '../../motion';
import { modalEdges } from '../../navigation';
import { useApp } from '../../state/AppState';
import { radius, space, useTheme } from '../../theme';

// Presented as a page sheet: swipe down or tap Cancel to dismiss without changes.
export default function Swap() {
  const c = useTheme();
  const app = useApp();
  const { t, tx, minutes, midSentence } = useT();
  // Clamp once so the shown meal and the swapped meal are always the same slot.
  const raw = Number(useLocalSearchParams<{ slot: string }>().slot);
  const slot = Number.isInteger(raw) && raw >= 0 && raw < app.plan.length ? raw : 0;
  const current = app.plan[slot];
  const typeLabel = current ? tx(MEAL_LABELS[current.type]) : t('Meal');

  // Options come from the household's filters: the example pool, or the meal-options function when live.
  const [options, setOptions] = useState<Meal[] | null>(null);
  const [pick, setPick] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    app
      .getSwapOptions(slot)
      .then((o) => {
        if (cancelled) return;
        setOptions(o);
        setPick(o[0]?.id);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // Load once per sheet; later changes to the plan should not reshuffle the choices.
  }, [slot]);

  if (!current) return null;
  const chosen = options?.find((o) => o.id === pick);
  const newTotal = app.planTotal - current.cost + (chosen?.cost ?? current.cost);
  // The new total is drawn bold, so the sentence is split where it goes.
  const [before, after = ''] = t('{total} of ${budget} · est.', { budget: app.budget }).split('{total}');

  const confirm = async () => {
    if (!chosen) return;
    setSaving(true);
    try {
      await app.swapMeal(slot, chosen);
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={modalEdges} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <TextButton label={t('Cancel')} bold={false} onPress={() => router.back()} />
        </View>
        <AppText variant="headline" accessibilityRole="header">
          {t('Swap {day}’s {meal}', { day: tx(current.dayLong), meal: midSentence(typeLabel) })}
        </AppText>
        <View style={styles.side} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.now}>
          <View style={styles.flex}>
            <AppText variant="eyebrow">{t('Now')}</AppText>
            <AppText variant="headline">{tx(current.name)}</AppText>
          </View>
          <AppText variant="money">${current.cost}</AppText>
        </Card>

        <View style={styles.group}>
          <AppText variant="eyebrow" accessibilityRole="header">{t('Swap for')}</AppText>
          {options === null && !error ? (
            <ActivityIndicator accessibilityLabel={t('Finding options')} color={c.primary} style={styles.loading} />
          ) : null}
          {error ? (
            <View accessibilityRole="alert">
              <Card style={styles.none}>
                <AppText color={c.warn}>{error}</AppText>
              </Card>
            </View>
          ) : null}
          {options?.length === 0 ? (
            <Card style={[styles.none, styles.noneCentered]}>
              <Mascot pose="think" size={110} decorative />
              <AppText color={c.muted} style={styles.centerText}>{t('No other {meal} options fit your household and kitchen.', { meal: typeLabel.toLowerCase() })}</AppText>
              <TextButton label={t('Update Kitchen')} onPress={() => router.push('/onboarding/kitchen?edit=1')} />
            </Card>
          ) : null}
          <View accessibilityRole="radiogroup" style={styles.group}>
            {(options ?? []).map((o) => {
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
                    <AppText variant="headline">{tx(o.name)}</AppText>
                    <AppText variant="subhead">{minutes(o.minutes)}</AppText>
                  </View>
                  <View style={styles.price}>
                    <AppText variant="money">${o.cost}</AppText>
                    <AppText variant="footnote" weight="600" color={diff <= 0 ? c.primaryText : c.warn}>
                      {diff < 0
                        ? t('Saves ${amount}', { amount: -diff })
                        : diff === 0
                          ? t('Same cost')
                          : t('${amount} more', { amount: diff })}
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
          <AppText variant="subhead">{t('New weekly total')}</AppText>
          <AppText variant="subhead" color={c.text} style={{ fontVariant: ['tabular-nums'] }}>
            {before}
            <AppText variant="subhead" weight="700" color={newTotal > app.budget ? c.warn : c.text}>${newTotal}</AppText>
            {after}
          </AppText>
        </View>
        {chosen ? (
          <PrimaryButton label={saving ? t('Swapping…') : t('Swap {meal}', { meal: midSentence(typeLabel) })} feedback="success" onPress={saving ? () => {} : confirm} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  noneCentered: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  side: { flex: 1, alignItems: 'flex-start' },
  content: { paddingHorizontal: space.gutter, paddingVertical: 12, gap: 16 },
  now: { borderRadius: radius.row, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  group: { gap: 8 },
  loading: { paddingVertical: 24 },
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
