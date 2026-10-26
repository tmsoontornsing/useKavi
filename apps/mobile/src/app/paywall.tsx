import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { IconButton, PrimaryButton, TextButton } from '../components/Buttons';
import { RadioDot } from '../components/Controls';
import { money, PLANS } from '../data/mock';
import { haptic, PressableScale, Reveal } from '../motion';
import { modalEdges, openUrl } from '../navigation';
import { useApp } from '../state/AppState';
import { fonts, radius, space, useTheme } from '../theme';

const BENEFITS = [
  'A new plan every week, not just one a month',
  'Swap any meal and watch the budget update',
  'Share the grocery list with everyone at home',
];

const price = (n: number) => (Number.isInteger(n) ? `$${n}` : money(n));

// Shown after sign-up and from Settings. Presented as a page sheet: close it to stay on the free plan.
// Purchases go through RevenueCat later; this build only marks you subscribed.
export default function Paywall() {
  const c = useTheme();
  const app = useApp();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('annual');
  const chosen = PLANS.find((p) => p.id === plan) ?? PLANS[0];

  return (
    <SafeAreaView edges={modalEdges} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.top}>
        <TextButton
          label="Restore"
          bold={false}
          color={c.muted}
          onPress={() => Alert.alert('No purchases found', 'There’s nothing to restore on this account.')}
        />
        <IconButton icon="close" label="Close, stay on the free plan" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.intro}>
            <Image source={require('../../assets/icon.png')} style={styles.icon} accessibilityIgnoresInvertColors />
            <AppText variant="largeTitle" accessibilityRole="header" style={styles.center}>
              Plan every week, stay under budget
            </AppText>
            <AppText color={c.muted} style={styles.center}>
              The free plan covers one week a month. Kavi Plus covers all of them.
            </AppText>
          </View>
        </Reveal>

        <Reveal index={1}>
          <View accessibilityRole="radiogroup" accessibilityLabel="Choose a plan" style={styles.plans}>
            {PLANS.map((p) => {
              const on = p.id === plan;
              return (
                <View key={p.id} style={styles.planWrap}>
                  <PressableScale
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${p.name}, ${price(p.price)} per ${p.per}`}
                    to={0.98}
                    onPress={() => {
                      if (!on) haptic.select();
                      setPlan(p.id);
                    }}
                    style={({ pressed }) => [
                      styles.plan,
                      { backgroundColor: c.card, borderColor: on ? c.primary : c.control, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <RadioDot on={on} />
                    <View style={styles.flex}>
                      <View style={styles.nameRow}>
                        <AppText variant="headline">{p.name}</AppText>
                        {p.badge ? (
                          <View style={[styles.chip, { backgroundColor: c.badge }]}>
                            <AppText variant="footnote" weight="700" color={c.badgeText}>{p.badge}</AppText>
                          </View>
                        ) : null}
                      </View>
                      <AppText variant="footnote">{p.billed}</AppText>
                    </View>
                    <View style={styles.priceCol}>
                      <AppText style={[styles.price, { fontFamily: fonts.displaySemi }]}>{price(p.price)}</AppText>
                      <AppText variant="footnote">{`per ${p.per}`}</AppText>
                    </View>
                  </PressableScale>
                  {p.best ? (
                    <View pointerEvents="none" style={[styles.best, { backgroundColor: c.primary }]}>
                      <AppText variant="footnote" weight="700" color={c.onPrimary} style={styles.bestText}>BEST VALUE</AppText>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Reveal>

        <Reveal index={2}>
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefit}>
                <View style={[styles.check, { backgroundColor: c.tint }]}>
                  <Ionicons name="checkmark" size={14} color={c.primaryText} />
                </View>
                <AppText style={styles.flex}>{b}</AppText>
              </View>
            ))}
          </View>
        </Reveal>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.line }]}>
        <PrimaryButton
          label="Continue"
          feedback="success"
          onPress={() => {
            app.subscribe();
            router.back();
          }}
        />
        <AppText variant="footnote" style={styles.center}>
          {`Auto-renews at ${price(chosen.price)}/${chosen.per}. Cancel anytime.`}
        </AppText>
        <View style={styles.links}>
          <TextButton label="Not Now" bold={false} color={c.muted} onPress={() => router.back()} />
          <TextButton label="Terms and Privacy" bold={false} color={c.muted} onPress={() => openUrl('https://usekavi.com')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  content: { paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 16, gap: 24 },
  intro: { alignItems: 'center', gap: 10 },
  icon: { width: 72, height: 72, borderRadius: 18, marginBottom: 4 },
  center: { textAlign: 'center' },
  plans: { gap: 18, paddingTop: 8 },
  planWrap: { position: 'relative' },
  plan: {
    minHeight: 76,
    borderRadius: radius.card,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: 22, fontVariant: ['tabular-nums'] },
  best: { position: 'absolute', top: -11, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: radius.pill },
  bestText: { letterSpacing: 0.6 },
  benefits: { gap: 12 },
  benefit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'stretch' },
});
