import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, IconButton } from '../../components/Buttons';
import { CheckCircle, ProgressBar } from '../../components/Controls';
import { Mascot } from '../../components/Mascot';
import { SwipeRow } from '../../components/SwipeRow';
import { TabScreen } from '../../components/TabScreen';
import { money } from '../../data/mock';
import { animateLayout, haptic, PressableScale, reduceMotion, useCountUp } from '../../motion';
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
  const { checked, toggleChecked, groceries, groceryTotal, pantrySavings, pantry } = useApp();
  const [open, setOpen] = useState<Record<string, boolean>>({ Produce: true });

  const all = groceries.flatMap((a) => a.items);
  const done = all.filter((i) => checked[i.key]).length;
  const total = useCountUp(groceryTotal);
  // A short, readable summary of the shelf: the first few items, then "and more".
  const shelf = pantry.flatMap((s) => s.items).map((i) => i.toLowerCase());
  const shelfText = shelf.length <= 3 ? shelf.join(', ') : `${shelf.slice(0, 3).join(', ')}, and more`;

  const share = () => {
    const text = groceries.map(
      (a) => `${a.name}\n${a.items.map((i) => `${checked[i.key] ? '✓' : '•'} ${i.name}`).join('\n')}`,
    ).join('\n\n');
    shareText(`Kavi grocery list\n\n${text}`);
  };

  // The total sits in the header because the floating iOS tab bar would cover a pinned footer.
  const header = (
    <>
      <View style={styles.headRow}>
        <AppText variant="largeTitle" accessibilityRole="header" style={styles.flex}>Grocery List</AppText>
        <IconButton icon="share-outline" label="Share list with your household" onPress={share} />
      </View>
      <View style={[styles.summary, { backgroundColor: c.card }]}>
        <View style={styles.flex}>
          <AppText variant="subhead" color={c.text} style={styles.nums}>{done} of {all.length} items in your cart</AppText>
          <AppText variant="footnote">Estimated total · US average prices</AppText>
          <View style={styles.cartBar}>
            <ProgressBar value={done} max={all.length} label={`${done} of ${all.length} items in your cart`} />
          </View>
        </View>
        <AppText variant="money" style={{ fontSize: 24 }}>{money(total)}</AppText>
      </View>
    </>
  );

  return (
    <TabScreen tab="groceries" header={header}>
      <View style={styles.pantry}>
        <AppText variant="subhead" style={styles.pantryText}>
          {shelf.length === 0 ? 'Add what you already have in Pantry and it comes off this list.' : `On your pantry shelf: ${shelfText}.`}
          {pantrySavings > 0 ? (
            <>
              {' That saves about '}
              <AppText variant="subhead" color={c.text} weight="700">{money(pantrySavings)}</AppText> this week.
            </>
          ) : null}
        </AppText>
        <Image source={require('../../../assets/shelves/shelf1.png')} style={styles.shelf} resizeMode="stretch" />
      </View>

      {all.length === 0 ? (
        <Card style={styles.emptyList}>
          <Mascot pose="peek" size={120} decorative />
          <AppText variant="headline">Your list is empty</AppText>
          <AppText color={c.muted} style={styles.centerText}>
            It fills in when you plan a week. Items already on your pantry shelf are left off.
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
              <AppText variant="headline" style={styles.flex}>{aisle.name}</AppText>
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
                        label: on ? 'Undo' : 'In cart',
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
                        {item.name}
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
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  nums: { fontVariant: ['tabular-nums'] },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pantry: { marginBottom: 2 },
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
