import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, Linking, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { EstimateNote } from '../../components/EstimateNote';
import { usePlusLabel } from '../../components/PlusLock';
import { Card, IconButton } from '../../components/Buttons';
import { CheckCircle, ProgressBar } from '../../components/Controls';
import { Mascot } from '../../components/Mascot';
import { SwipeRow } from '../../components/SwipeRow';
import { TabScreen } from '../../components/TabScreen';
import { money } from '../../data/mock';
import { comma, useT } from '../../i18n';
import { animateLayout, haptic, PressableScale, reduceMotion, Reveal, useCountUp } from '../../motion';
import { remindersAvailable, sendToReminders } from '../../lib/reminders';
import { share as shareText } from '../../navigation';
import { useApp } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

// Chevron that turns over as an aisle opens and closes.
function Chevron({ open }: { open: boolean }) {
  const c = useTheme();
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion()) {
      turn.setValue(open ? 1 : 0);
      return;
    }
    Animated.timing(turn, { toValue: open ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [open, turn]);

  return (
    <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
      <Ionicons name="chevron-down" size={18} color={c.muted} />
    </Animated.View>
  );
}

export default function Groceries() {
  const c = useTheme();
  const { t, tn, tx, line } = useT();
  const { checked, toggleChecked, groceries, groceryTotal, pantrySavings, pantry, subscribed } = useApp();
  const plusLabel = usePlusLabel();
  // Sharing and exporting the list are part of Kavi Plus.
  // Free users see the normal icons; tapping one opens the paywall as a modal.
  const seePlus = () => router.push('/paywall');
  const [open, setOpen] = useState<Record<string, boolean>>({ Produce: true });

  const all = groceries.flatMap((a) => a.items);
  const done = all.filter((i) => checked[i.key]).length;
  const total = useCountUp(groceryTotal);
  // A short, readable summary of the shelf: the first few items, then "and more".
  const shelf = pantry.flatMap((s) => s.items).map((i) => tx(i).toLowerCase());
  const shelfText = shelf.length <= 3 ? shelf.join(comma()) : t('{items}, and more', { items: shelf.slice(0, 3).join(comma()) });
  // The savings figure is bold inside its sentence, so the translated sentence is split around it.
  const [savesBefore, savesAfter = ''] = t('That saves about {amount} this week.').split('{amount}');

  // Puts the unchecked items into the Kavi Groceries list in Apple Reminders.
  const [sending, setSending] = useState(false);
  const toReminders = async () => {
    if (sending) return;
    setSending(true);
    try {
      const r = await sendToReminders(groceries, checked);
      if (r.status === 'denied') {
        Alert.alert(
          t('Kavi can’t reach Reminders'),
          r.canAskAgain
            ? t('Allow Reminders access to send your list there.')
            : t('Turn on Reminders for Kavi in Settings, then try again.'),
          r.canAskAgain
            ? [{ text: t('OK') }]
            : [{ text: t('Not Now'), style: 'cancel' }, { text: t('Open Settings'), onPress: () => Linking.openSettings() }],
        );
      } else if (r.status === 'nothing') {
        Alert.alert(t('Nothing to send'), t('Every item on your list is already in your cart.'));
      } else {
        haptic.success();
        Alert.alert(
          r.added > 0 ? tn(r.added, 'Added {n} item to Reminders', 'Added {n} items to Reminders') : t('Already in Reminders'),
          r.added === 0
            ? t('Everything on your list is in Kavi Groceries.')
            : r.alreadyThere > 0
              ? t('They are in a list called Kavi Groceries. {n} were already there.', { n: r.alreadyThere })
              : t('They are in a list called Kavi Groceries.'),
          [{ text: t('Done'), style: 'cancel' }, { text: t('Open Reminders'), onPress: () => Linking.openURL('x-apple-reminderkit://').catch(() => {}) }],
        );
      }
    } catch (e) {
      Alert.alert(t('Couldn’t add to Reminders'), (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const share = () => {
    const text = groceries.map(
      (a) => `${tx(a.name)}\n${a.items.map((i) => `${checked[i.key] ? '✓' : '•'} ${line(i.name)}`).join('\n')}`,
    ).join('\n\n');
    shareText(`${t('Kavi grocery list')}\n\n${text}`, t('Kavi grocery list'));
  };

  // The total sits in the header because the floating iOS tab bar would cover a pinned footer.
  const header = (
    <>
      <View style={styles.headRow}>
        <AppText variant="largeTitle" accessibilityRole="header" style={styles.flex}>{t('Grocery List')}</AppText>
        {remindersAvailable ? (
          <IconButton
            icon="checkbox-outline"
            label={plusLabel(t('Add list to Reminders'), subscribed)}
            onPress={subscribed ? toReminders : seePlus}
          />
        ) : null}
        <IconButton
          icon="share-outline"
          label={plusLabel(t('Share your grocery list'), subscribed)}
          onPress={subscribed ? share : seePlus}
        />
      </View>
      <View style={[styles.summary, { backgroundColor: c.card }]}>
        <View style={styles.flex}>
          <AppText variant="subhead" color={c.text} style={styles.nums}>{t('{done} of {total} items in your cart', { done, total: all.length })}</AppText>
          <AppText variant="footnote">{t('Estimated total · US average prices')}</AppText>
          <View style={styles.cartBar}>
            <ProgressBar value={done} max={all.length} label={t('{done} of {total} items in your cart', { done, total: all.length })} />
          </View>
        </View>
        <AppText variant="money" style={{ fontSize: 24 }}>{money(total)}</AppText>
      </View>
    </>
  );

  return (
    <TabScreen tab="groceries" header={header}>
      <View style={styles.pantry}>
        <View style={styles.pantryRow}>
          {pantrySavings > 0 ? <Mascot pose="save" size={64} decorative tappable style={styles.savePip} /> : null}
        <AppText variant="subhead" style={[styles.pantryText, styles.flex]}>
          {shelf.length === 0 ? t('Add what you already have in Pantry and it comes off this list.') : t('On your pantry shelf: {items}.', { items: shelfText })}
          {pantrySavings > 0 ? (
            <>
              {` ${savesBefore}`}
              <AppText variant="subhead" color={c.text} weight="700">{money(pantrySavings)}</AppText>
              {savesAfter}
            </>
          ) : null}
        </AppText>
        </View>
        <Image source={require('../../../assets/shelves/shelf1.png')} style={styles.shelf} resizeMode="stretch" />
      </View>

      {all.length > 0 && done === all.length ? (
        <Reveal lift={12}>
          <Card style={styles.cartFull}>
            <Mascot pose="cheer" size={84} decorative tappable />
            <View style={styles.flex}>
              <AppText variant="headline">{t('Cart is full')}</AppText>
              <AppText variant="subhead">{t('Everything on the list is in your cart. Nice shop.')}</AppText>
            </View>
          </Card>
        </Reveal>
      ) : null}

      {all.length === 0 ? (
        <Card style={styles.emptyList}>
          <Mascot pose="peek" size={120} decorative />
          <AppText variant="headline">{t('Your list is empty')}</AppText>
          <AppText color={c.muted} style={styles.centerText}>
            {t('It fills in when you plan a week. Items already on your pantry shelf are left off.')}
          </AppText>
        </Card>
      ) : null}

      {groceries.map((aisle) => {
        const isOpen = !!open[aisle.name];
        const sub = aisle.items.reduce((s, i) => s + i.price, 0);
        return (
          <Card key={aisle.name} style={styles.aisle}>
            <PressableScale
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              to={0.99}
              onPress={() => {
                haptic.select();
                animateLayout();
                setOpen((o) => ({ ...o, [aisle.name]: !isOpen }));
              }}
              style={({ pressed }) => [styles.aisleHead, { opacity: pressed ? 0.7 : 1 }]}
            >
              <AppText variant="headline" style={styles.flex}>{tx(aisle.name)}</AppText>
              <AppText variant="subhead" style={styles.nums}>{aisle.items.length} · {money(sub)}</AppText>
              <Chevron open={isOpen} />
            </PressableScale>
            {isOpen
              ? aisle.items.map((item) => {
                  const on = !!checked[item.key];
                  return (
                    <SwipeRow
                      key={item.key}
                      background={c.card}
                      start={{
                        label: on ? t('Undo') : t('In cart'),
                        icon: on ? 'arrow-undo' : 'cart',
                        background: on ? c.control : c.primary,
                        foreground: on ? c.text : c.onPrimary,
                        onTrigger: () => toggleChecked(item.key),
                      }}
                    >
                    <PressableScale
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      to={0.98}
                      onPress={() => {
                        haptic.tap();
                        toggleChecked(item.key);
                      }}
                      style={({ pressed }) => [
                        styles.item,
                        { borderTopColor: c.line, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <CheckCircle on={on} />
                      <AppText
                        style={[styles.flex, on && styles.done]}
                        color={on ? c.muted : c.text}
                      >
                        {line(item.name)}
                      </AppText>
                      <AppText variant="subhead" style={styles.nums}>{money(item.price)}</AppText>
                    </PressableScale>
                    </SwipeRow>
                  );
                })
              : null}
          </Card>
        );
      })}
      {all.length > 0 ? <EstimateNote /> : null}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  nums: { fontVariant: ['tabular-nums'] },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pantry: { marginBottom: 2 },
  pantryRow: { flexDirection: 'row', alignItems: 'center' },
  savePip: { marginLeft: -6, marginVertical: -8 },
  pantryText: { paddingHorizontal: 6, paddingBottom: 4 },
  shelf: { width: '100%', height: 34 },
  aisle: { borderRadius: radius.row, overflow: 'hidden' },
  aisleHead: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  item: {
    minHeight: 48,
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  done: { textDecorationLine: 'line-through' },
  cartFull: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyList: { padding: 16, alignItems: 'center', gap: 4 },
  centerText: { textAlign: 'center' },
  cartBar: { marginTop: 8 },
  summary: {
    borderRadius: radius.row,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
