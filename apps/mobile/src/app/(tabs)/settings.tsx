import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card } from '../../components/Buttons';
import { KaviSwitch } from '../../components/Controls';
import { Mascot } from '../../components/Mascot';
import { TabScreen } from '../../components/TabScreen';
import { applianceName, DIETS } from '../../data/mock';
import { openUrl, resetTo, share } from '../../navigation';
import { useApp, type PlanStatus } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

export default function Settings() {
  const c = useTheme();
  const app = useApp();
  const dietName = DIETS.find((d) => d.id === app.diet)?.name ?? 'Everything';
  // Row value stays on one line: the first two names, then a count of the rest.
  const kitchen = app.appliances.map(applianceName);
  const kitchenSummary =
    kitchen.length === 0 ? 'None' : kitchen.length <= 2 ? kitchen.join(', ') : `${kitchen.slice(0, 2).join(', ')} +${kitchen.length - 2}`;

  const likesSummary =
    app.likes.length === 0 ? 'None yet' : app.likes.length <= 2 ? app.likes.join(', ') : `${app.likes.slice(0, 2).join(', ')} +${app.likes.length - 2}`;

  const confirmDelete = () =>
    Alert.alert(
      'Delete your account?',
      'This removes your household, plans, and grocery lists. You can’t undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await app.deleteAccount();
              resetTo('/welcome');
            } catch (e) {
              Alert.alert('Couldn’t delete your account', (e as Error).message);
            }
          },
        },
      ],
    );

  return (
    <TabScreen tab="settings" header={<AppText variant="largeTitle" accessibilityRole="header">Settings</AppText>}>
      <Pressable
        accessibilityRole={app.subscribed ? 'summary' : 'button'}
        disabled={app.subscribed}
        onPress={() => router.push('/paywall')}
        style={({ pressed }) => [styles.planCard, { backgroundColor: c.card, opacity: pressed ? 0.7 : 1 }]}
      >
        <Mascot pose={app.subscribed ? 'cheer' : 'sleep'} size={64} decorative style={styles.planPip} />
        <View style={styles.flex}>
          <AppText variant="headline">{app.subscribed ? 'Kavi Plus' : 'Free Plan'}</AppText>
          <AppText variant="subhead">
            {app.subscribed ? 'A new plan every week' : '1 of 1 plans used this month'}
          </AppText>
        </View>
        {app.subscribed ? null : (
          <AppText variant="subhead" weight="600" color={c.primaryText}>Get Kavi Plus</AppText>
        )}
      </Pressable>

      <Section title="Household">
        <LinkRow label="People eating" value={String(app.people)} href="/onboarding/household?edit=1" first />
        <LinkRow label="Weekly budget" value={`$${app.budget}`} href="/onboarding/household?edit=1" />
        <LinkRow label="Diet" value={dietName} href="/onboarding/diet?edit=1" />
        <LinkRow label="Allergies" value={app.allergies.join(', ') || 'None'} href="/onboarding/household?edit=1" />
        <LinkRow label="Dislikes" value={app.dislikes.join(', ') || 'None'} href="/onboarding/household?edit=1" />
        <LinkRow label="Foods you like" value={likesSummary} href="/onboarding/household?edit=1" />
        <LinkRow label="Kitchen" value={kitchenSummary} href="/onboarding/kitchen?edit=1" />
      </Section>

      <Section title="Shared list" footer="People you invite see the grocery list and can check items off.">
        <StaticRow label="Members" value="Only you" first />
        <ActionRow
          label="Invite Someone"
          onPress={() => share('Join my Kavi household to share our grocery list: https://usekavi.com')}
        />
      </Section>

      <Section title="Notifications">
        <SwitchRow
          label="Sunday plan reminder"
          detail="Sundays at 5 PM"
          value={app.remindSunday}
          onChange={app.setRemindSunday}
          first
        />
        <SwitchRow
          label="Grocery list changes"
          detail="When someone checks off or adds items"
          value={app.notifyListChanges}
          onChange={app.setNotifyListChanges}
        />
      </Section>

      <Section
        title="Account"
        footer="Deleting your account removes your household, plans, and lists. Subscriptions are managed in your App Store or Google Play settings."
      >
        <StaticRow label="Account" value={app.live ? (app.email ?? 'Signed in') : 'Example data, not saved'} first />
        <ActionRow label="Restore Purchases" onPress={() => Alert.alert('No purchases found', 'There’s nothing to restore on this account.')} />
        <ActionRow
          label="Sign Out"
          onPress={() => {
            app.signOut().finally(() => resetTo('/welcome'));
          }}
        />
        <ActionRow label="Delete Account" danger onPress={confirmDelete} />
      </Section>

      <Section title="About">
        <ActionRow label="Terms and Privacy" onPress={() => openUrl('https://usekavi.com')} first chevron />
        <StaticRow label="Version" value="1.0.0" />
      </Section>

      {__DEV__ ? <DevStates /> : null}
    </TabScreen>
  );
}

// Development only: switch This Week between its states to check each design.
function DevStates() {
  const app = useApp();
  const states: [PlanStatus, string][] = [
    ['ready', 'Plan'],
    ['loading', 'Loading'],
    ['empty', 'Empty'],
    ['error', 'Error'],
  ];
  return (
    <Section title="Developer" footer="Shown only in development builds.">
      {states.map(([s, label], i) => (
        <ActionRow
          key={s}
          label={`${app.planStatus === s ? '✓ ' : ''}Show ${label} State`}
          onPress={() => {
            app.setPlanStatus(s);
            router.navigate('/week');
          }}
          first={i === 0}
        />
      ))}
    </Section>
  );
}

function Section({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="eyebrow" style={styles.sectionTitle} accessibilityRole="header">{title}</AppText>
      <Card style={styles.group}>{children}</Card>
      {footer ? <AppText variant="footnote" style={styles.sectionTitle}>{footer}</AppText> : null}
    </View>
  );
}

function useDivider(first?: boolean) {
  const c = useTheme();
  return first ? null : { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line };
}

function LinkRow({ label, value, href, first }: { label: string; value: string; href: Href; first?: boolean }) {
  const c = useTheme();
  const divider = useDivider(first);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.row, divider, { opacity: pressed ? 0.6 : 1 }]}
    >
      <AppText style={styles.label}>{label}</AppText>
      <AppText color={c.muted} numberOfLines={1} style={styles.value}>{value}</AppText>
      <Ionicons name="chevron-forward" size={16} color={c.control} />
    </Pressable>
  );
}

function StaticRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const c = useTheme();
  const divider = useDivider(first);
  return (
    <View style={[styles.row, divider]}>
      <AppText style={styles.label}>{label}</AppText>
      <AppText color={c.muted} style={styles.value}>{value}</AppText>
    </View>
  );
}

function ActionRow({
  label,
  onPress,
  danger,
  first,
  chevron,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  first?: boolean;
  chevron?: boolean;
}) {
  const c = useTheme();
  const divider = useDivider(first);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider, { opacity: pressed ? 0.6 : 1 }]}
    >
      <AppText style={styles.label} color={chevron ? c.text : danger ? c.danger : c.primaryText}>{label}</AppText>
      {chevron ? <Ionicons name="chevron-forward" size={16} color={c.control} /> : null}
    </Pressable>
  );
}

function SwitchRow({
  label,
  detail,
  value,
  onChange,
  first,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
  first?: boolean;
}) {
  const divider = useDivider(first);
  return (
    <View style={[styles.row, styles.switchRow, divider]}>
      <View style={styles.flex}>
        <AppText>{label}</AppText>
        <AppText variant="footnote">{detail}</AppText>
      </View>
      <KaviSwitch label={label} value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  planCard: { borderRadius: radius.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planPip: { marginVertical: -6, marginLeft: -4 },
  section: { gap: 6, marginBottom: 16 },
  sectionTitle: { paddingHorizontal: 16 },
  group: { overflow: 'hidden' },
  row: { minHeight: 48, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchRow: { paddingVertical: 8 },
  label: { flexShrink: 0 },
  value: { flex: 1, textAlign: 'right' },
});
