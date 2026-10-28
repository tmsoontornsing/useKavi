import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { EstimateNote } from '../../components/EstimateNote';
import { Card } from '../../components/Buttons';
import { KaviSwitch } from '../../components/Controls';
import { Mascot } from '../../components/Mascot';
import { TabScreen } from '../../components/TabScreen';
import { applianceName, DIETS } from '../../data/mock';
import { comma, LANGUAGES, useLanguage, useT } from '../../i18n';
import { LEGAL } from '../../legal/config';
import { openUrl, resetTo, share } from '../../navigation';
import { useApp, type PlanStatus } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

export default function Settings() {
  const c = useTheme();
  const app = useApp();
  const { t, tx } = useT();
  const { choice, lang } = useLanguage();
  const language = choice === 'system' ? t('Same as phone') : LANGUAGES.find((l) => l.code === lang)!.native;
  const dietName = tx(DIETS.find((d) => d.id === app.diet)?.name ?? 'Everything');
  // Row value stays on one line: the first two names, then a count of the rest.
  const summary = (names: string[], none: string) =>
    names.length === 0 ? none : names.length <= 2 ? names.join(comma()) : `${names.slice(0, 2).join(comma())} +${names.length - 2}`;
  const kitchenSummary = summary(app.appliances.map((a) => tx(applianceName(a))), t('None'));
  const likesSummary = summary(app.likes.map(tx), t('None yet'));

  const confirmDelete = () =>
    Alert.alert(
      t('Delete your account?'),
      t('This removes your household, plans, and grocery lists. You can’t undo this.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete Account'),
          style: 'destructive',
          onPress: async () => {
            try {
              await app.deleteAccount();
              resetTo('/welcome');
            } catch (e) {
              Alert.alert(t('Couldn’t delete your account'), (e as Error).message);
            }
          },
        },
      ],
    );

  return (
    <TabScreen tab="settings" header={<AppText variant="largeTitle" accessibilityRole="header">{t('Settings')}</AppText>}>
      <Pressable
        accessibilityRole={app.subscribed ? 'summary' : 'button'}
        disabled={app.subscribed}
        onPress={() => router.push('/plus')}
        style={({ pressed }) => [styles.planCard, { backgroundColor: c.card, opacity: pressed ? 0.7 : 1 }]}
      >
        <Mascot pose={app.subscribed ? 'cheer' : 'sleep'} size={64} decorative style={styles.planPip} />
        <View style={styles.flex}>
          <AppText variant="headline">{app.subscribed ? 'Kavi Plus' : t('Free Plan')}</AppText>
          <AppText variant="subhead">
            {app.subscribed ? t('A new plan every week') : t('1 of 1 plans used this month')}
          </AppText>
        </View>
        {app.subscribed ? null : (
          <AppText variant="subhead" weight="600" color={c.primaryText}>{t('Get Kavi Plus')}</AppText>
        )}
      </Pressable>

      <Section title={t('Household')}>
        <LinkRow label={t('People eating')} value={String(app.people)} href="/onboarding/household?edit=1" first />
        <LinkRow label={t('Weekly budget')} value={`$${app.budget}`} href="/onboarding/household?edit=1" />
        <LinkRow label={t('Diet')} value={dietName} href="/onboarding/diet?edit=1" />
        <LinkRow label={t('Allergies')} value={app.allergies.map(tx).join(comma()) || t('None')} href="/onboarding/household?edit=1" />
        <LinkRow label={t('Dislikes')} value={app.dislikes.map(tx).join(comma()) || t('None')} href="/onboarding/household?edit=1" />
        <LinkRow label={t('Foods you like')} value={likesSummary} href="/onboarding/household?edit=1" />
        <LinkRow label={t('Kitchen')} value={kitchenSummary} href="/onboarding/kitchen?edit=1" />
      </Section>

      <Section title={t('Language')} footer={t('Recipes, ingredients, and your grocery list switch too.')}>
        <LinkRow label={t('App language')} value={language} href="/language" first />
      </Section>

      <Section title={t('Shared list')} footer={t('People you invite see the grocery list and can check items off.')}>
        <StaticRow label={t('Members')} value={t('Only you')} first />
        <ActionRow
          label={t('Invite Someone')}
          onPress={() => share(t('Join my Kavi household to share our grocery list: {url}', { url: 'https://usekavi.com' }))}
        />
      </Section>

      <Section title={t('Notifications')}>
        <SwitchRow
          label={t('Sunday plan reminder')}
          detail={t('Sundays at 5 PM')}
          value={app.remindSunday}
          onChange={app.setRemindSunday}
          first
        />
        <SwitchRow
          label={t('Grocery list changes')}
          detail={t('When someone checks off or adds items')}
          value={app.notifyListChanges}
          onChange={app.setNotifyListChanges}
        />
      </Section>

      <Section
        title={t('Account')}
        footer={t('Deleting your account removes your household, plans, and lists. Subscriptions are managed in your App Store or Google Play settings.')}
      >
        <StaticRow label={t('Account')} value={app.live ? (app.email ?? t('Signed in')) : t('Example data, not saved')} first />
        <ActionRow
          label={t('Restore Purchases')}
          onPress={() => Alert.alert(t('No purchases found'), t('There’s nothing to restore on this account.'))}
        />
        <ActionRow
          label={t('Sign Out')}
          onPress={() => {
            app.signOut().finally(() => resetTo('/welcome'));
          }}
        />
        <ActionRow label={t('Delete Account')} danger onPress={confirmDelete} />
      </Section>

      <EstimateNote />

      <Section title={t('About')}>
        <ActionRow label={t('Terms of Service')} onPress={() => router.push('/legal/terms')} first chevron />
        <ActionRow label={t('Privacy Policy')} onPress={() => router.push('/legal/privacy')} chevron />
        <ActionRow label={t('Contact Us')} onPress={() => openUrl(`mailto:${LEGAL.email}`)} chevron />
        <StaticRow label={t('Version')} value="1.0.0" />
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
