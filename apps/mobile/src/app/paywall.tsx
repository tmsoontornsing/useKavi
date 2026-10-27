import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { IconButton, PrimaryButton, TextButton } from '../components/Buttons';
import { RadioDot } from '../components/Controls';
import { Mascot } from '../components/Mascot';
import { money, PLANS } from '../data/mock';
import { useT } from '../i18n';
import { haptic, PressableScale, Reveal } from '../motion';
import { modalEdges } from '../navigation';
import { useApp } from '../state/AppState';
import { fonts, radius, space, useTheme } from '../theme';

const price = (n: number) => (Number.isInteger(n) ? `$${n}` : money(n));

// Shown after sign-up and from Settings. Presented as a page sheet: close it to stay on the free plan.
// Purchases go through RevenueCat later; this build only marks you subscribed.
export default function Paywall() {
  const c = useTheme();
  const app = useApp();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('annual');
  const chosen = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  const { t, tx } = useT();

  const benefits = [
    t('A new plan every week, not just one a month'),
    t('Swap any meal and watch the budget update'),
    t('Share the grocery list with everyone at home'),
  ];

  // Apple's required renewal terms, one whole paragraph per store so each names its own account and settings the way
  // that store does.
  const terms = { price: price(chosen.price), period: tx(chosen.per) };
  const renewal =
    Platform.OS === 'ios'
      ? t('Kavi Plus renews automatically at {price} per {period} until you cancel. Payment is charged to your Apple ID when you confirm. Turn off auto-renew at least 24 hours before the period ends to avoid the next charge. Manage or cancel any time in your App Store account settings.', terms)
      : t('Kavi Plus renews automatically at {price} per {period} until you cancel. Payment is charged to your Google Play account when you confirm. Turn off auto-renew at least 24 hours before the period ends to avoid the next charge. Manage or cancel any time in Google Play, under Payments and subscriptions.', terms);

  return (
    <SafeAreaView edges={modalEdges} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.top}>
        <TextButton
          label={t('Restore')}
          bold={false}
          color={c.muted}
          onPress={() => Alert.alert(t('No purchases found'), t('There’s nothing to restore on this account.'))}
        />
        <IconButton icon="close" label={t('Close, stay on the free plan')} onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.intro}>
            <Mascot pose="cheer" size={104} tappable label={t('Pip, Kavi\'s jar, cheering')} />
            <AppText variant="largeTitle" accessibilityRole="header" style={styles.center}>
              {t('Plan every week, stay under budget')}
            </AppText>
            <AppText color={c.muted} style={styles.center}>
              {t('The free plan covers one week a month. Kavi Plus covers all of them.')}
            </AppText>
          </View>
        </Reveal>

        <Reveal index={1}>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('Choose a plan')} style={styles.plans}>
            {PLANS.map((p) => {
              const on = p.id === plan;
              return (
                <View key={p.id} style={styles.planWrap}>
                  <PressableScale
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={t('{plan}, {price} per {period}', { plan: tx(p.name), price: price(p.price), period: tx(p.per) })}
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
                        <AppText variant="headline">{tx(p.name)}</AppText>
                        {p.badge ? (
                          <View style={[styles.chip, { backgroundColor: c.badge }]}>
                            <AppText variant="footnote" weight="700" color={c.badgeText}>{tx(p.badge)}</AppText>
                          </View>
                        ) : null}
                      </View>
                      <AppText variant="footnote">{tx(p.billed)}</AppText>
                    </View>
                    <View style={styles.priceCol}>
                      <AppText style={[styles.price, { fontFamily: fonts.displaySemi }]}>{price(p.price)}</AppText>
                      <AppText variant="footnote">{t('per {period}', { period: tx(p.per) })}</AppText>
                    </View>
                  </PressableScale>
                  {p.best ? (
                    <View pointerEvents="none" style={[styles.best, { backgroundColor: c.primary }]}>
                      <AppText variant="footnote" weight="700" color={c.onPrimary} style={styles.bestText}>{t('BEST VALUE')}</AppText>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Reveal>

        <Reveal index={2}>
          <View style={styles.benefits}>
            {benefits.map((b) => (
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
          label={t('Continue')}
          feedback="success"
          onPress={() => {
            app.subscribe();
            router.back();
          }}
        />
        <AppText variant="footnote" style={styles.center}>
          {renewal}
        </AppText>
        <View style={styles.links}>
          <TextButton label={t('Not Now')} bold={false} color={c.muted} onPress={() => router.back()} />
          <TextButton label={t('Terms')} bold={false} color={c.muted} onPress={() => router.push('/legal/terms')} />
          <TextButton label={t('Privacy')} bold={false} color={c.muted} onPress={() => router.push('/legal/privacy')} />
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
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: 22, fontVariant: ['tabular-nums'] },
  best: { position: 'absolute', top: -11, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: radius.pill },
  bestText: { letterSpacing: 0.6 },
  benefits: { gap: 12 },
  benefit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16 },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'stretch' },
});
