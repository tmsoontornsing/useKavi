import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, IconButton } from '../../components/Buttons';
import { CheckCircle } from '../../components/Controls';
import { TabScreen } from '../../components/TabScreen';
import { GROCERIES, money } from '../../data/mock';
import { share as shareText } from '../../navigation';
import { useApp } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

export default function Groceries() {
  const c = useTheme();
  const { checked, toggleChecked } = useApp();
  const [open, setOpen] = useState<Record<string, boolean>>({ Produce: true });

  const all = GROCERIES.flatMap((a) => a.items);
  const done = all.filter((i) => checked[i.name]).length;
  const total = all.reduce((s, i) => s + i.price, 0);

  const share = () => {
    const text = GROCERIES.map(
      (a) => `${a.name}\n${a.items.map((i) => `${checked[i.name] ? '✓' : '•'} ${i.name}`).join('\n')}`,
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
        </View>
        <AppText variant="money" style={{ fontSize: 24 }}>{money(total)}</AppText>
      </View>
    </>
  );

  return (
    <TabScreen header={header}>
      <View style={styles.pantry}>
        <AppText variant="subhead" style={styles.pantryText}>
          On your pantry shelf: rice, olive oil, garlic, and spices. That saves about{' '}
          <AppText variant="subhead" color={c.text} weight="700">$17.80</AppText> this week.
        </AppText>
        <Image source={require('../../../assets/shelves/shelf1.png')} style={styles.shelf} resizeMode="stretch" />
      </View>

      {GROCERIES.map((aisle) => {
        const isOpen = !!open[aisle.name];
        const sub = aisle.items.reduce((s, i) => s + i.price, 0);
        return (
          <Card key={aisle.name} style={styles.aisle}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setOpen((o) => ({ ...o, [aisle.name]: !isOpen }))}
              style={({ pressed }) => [styles.aisleHead, { opacity: pressed ? 0.7 : 1 }]}
            >
              <AppText variant="headline" style={styles.flex}>{aisle.name}</AppText>
              <AppText variant="subhead" style={styles.nums}>{aisle.items.length} · {money(sub)}</AppText>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
            </Pressable>
            {isOpen
              ? aisle.items.map((item) => {
                  const on = !!checked[item.name];
                  return (
                    <Pressable
                      key={item.name}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      onPress={() => toggleChecked(item.name)}
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
                    </Pressable>
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
  summary: {
    borderRadius: radius.row,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
