import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { IconButton, PrimaryButton, TextButton } from '../components/Buttons';
import { RadioDot } from '../components/Controls';
import { PLANS } from '../data/mock';
import { modalEdges, openUrl } from '../navigation';
import { useApp } from '../state/AppState';
import { radius, space, useTheme } from '../theme';

const BENEFITS = [
  'A new plan every week, not just one a month.',
  'Swap any dinner and see the budget update right away.',
  'Share the grocery list with everyone at home.',
  'Plans that use what is already on your pantry shelf.',
];

// Presented as a page sheet. Purchases go through RevenueCat later; this build only marks you subscribed.
export default function Paywall() {
  const c = useTheme();
  const app = useApp();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('annual');
  const chosen = PLANS.find((p) => p.id === plan) ?? PLANS[0];

  return (
    <SafeAreaView edges={modalEdges} style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Image source={require('../../assets/icon.png')} style={styles.icon} />
          <IconButton icon="close" label="Close" onPress={() => router.back()} />
        </View>

        <View style={styles.intro}>
          <AppText variant="eyebrow" color={c.primaryText}>Kavi Plus</AppText>
          <AppText variant="largeTitle" accessibilityRole="header">You’ve used this month’s free plan</AppText>
          <AppText color={c.muted}>Subscribe to plan every week, or wait until Nov 1 for your next free plan.</AppText>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefit}>
              <View style={[styles.check, { backgroundColor: c.tint }]}>
                <Ionicons name="checkmark" size={15} color={c.primaryText} />
              </View>
              <AppText style={styles.flex}>{b}</AppText>
            </View>
          ))}
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel="Choose a plan" style={styles.plans}>
          {PLANS.map((p) => {
            const on = p.id === plan;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPlan(p.id)}
                style={({ pressed }) => [
                  styles.plan,
                  { backgroundColor: c.card, borderColor: on ? c.primary : c.control, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <RadioDot on={on} />
                <View style={styles.flex}>
                  <AppText variant="headline">{p.name}</AppText>
                  <AppText variant="subhead" style={{ fontVariant: ['tabular-nums'] }}>{p.detail}</AppText>
                </View>
                {p.badge ? (
                  <View style={[styles.badge, { backgroundColor: c.badge }]}>
                    <AppText variant="footnote" weight="600" color={c.badgeText}>{p.badge}</AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.line }]}>
        <PrimaryButton
          label={chosen.cta}
          onPress={() => {
            app.subscribe();
            router.back();
          }}
        />
        <AppText variant="footnote" style={styles.center}>
          Renews automatically until canceled. Cancel anytime in your App Store or Google Play settings.
        </AppText>
        <View style={styles.links}>
          <TextButton
            label="Restore Purchases"
            onPress={() => Alert.alert('No purchases found', 'There’s nothing to restore on this account.')}
          />
          <TextButton label="Terms and Privacy" bold={false} color={c.muted} onPress={() => openUrl('https://usekavi.com')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  content: { paddingHorizontal: space.gutter, paddingTop: 16, paddingBottom: 12, gap: 18 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  icon: { width: 56, height: 56, borderRadius: 14 },
  intro: { gap: 6 },
  benefits: { gap: 12 },
  benefit: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  plans: { gap: 10 },
  plan: {
    minHeight: 64,
    borderRadius: radius.card,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'stretch' },
  center: { textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
});
