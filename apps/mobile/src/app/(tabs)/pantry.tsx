import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, IconButton, TextButton } from '../../components/Buttons';
import { Mascot } from '../../components/Mascot';
import { TabScreen } from '../../components/TabScreen';
import { money } from '../../data/mock';
import { allergensIn } from '../../lib/allergens';
import { animateLayout, haptic, PressableScale, Reveal, Wiggle } from '../../motion';
import { useApp } from '../../state/AppState';
import { fonts, radius, useTheme } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// The shelves a new item can go on, in the order they appear.
const SHELVES: { name: string; icon: IconName }[] = [
  { name: 'Staples', icon: 'basket-outline' },
  { name: 'Spices', icon: 'leaf-outline' },
  { name: 'Fridge', icon: 'snow-outline' },
  { name: 'Freezer', icon: 'cube-outline' },
];
const shelfIcon = (name: string): IconName => SHELVES.find((s) => s.name === name)?.icon ?? 'file-tray-outline';

// Things many kitchens already have, named the way the recipe catalog names them so the grocery list can match them.
const SUGGESTIONS: { name: string; shelf: string }[] = [
  { name: 'Butter', shelf: 'Fridge' },
  { name: 'Eggs', shelf: 'Fridge' },
  { name: 'Milk', shelf: 'Fridge' },
  { name: 'Soy sauce', shelf: 'Staples' },
  { name: 'Honey', shelf: 'Staples' },
  { name: 'Rolled oats', shelf: 'Staples' },
  { name: 'Spaghetti', shelf: 'Staples' },
  { name: 'Tomato paste', shelf: 'Staples' },
  { name: 'Paprika', shelf: 'Spices' },
  { name: 'Cinnamon', shelf: 'Spices' },
  { name: 'Italian seasoning', shelf: 'Spices' },
  { name: 'Frozen corn', shelf: 'Freezer' },
];

export default function Pantry() {
  const c = useTheme();
  const { pantry, pantrySavings, allergies, addPantryItem, removePantryItem } = useApp();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [shelf, setShelf] = useState('Staples');
  const count = pantry.reduce((n, s) => n + s.items.length, 0);
  const have = new Set(pantry.flatMap((s) => s.items.map((i) => i.toLowerCase())));
  const suggestions = SUGGESTIONS.filter((s) => !have.has(s.name.toLowerCase())).slice(0, 8);
  // Items whose names point to one of the household's allergies, for the warning card and the flagged chips.
  const flagged = pantry.flatMap((s) =>
    s.items.flatMap((item) => {
      const hits = allergensIn(item, allergies);
      return hits.length ? [{ item, shelf: s.name, hits }] : [];
    }),
  );
  const draftHits = allergensIn(draft, allergies);

  // Stays open after each add, so several things can go in one go.
  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    animateLayout();
    haptic.success();
    addPantryItem(shelf, name);
    setDraft('');
  };

  const quickAdd = (name: string, onShelf: string) => {
    animateLayout();
    haptic.success();
    addPantryItem(onShelf, name);
  };

  const closeAdd = () => {
    animateLayout();
    setDraft('');
    setAdding(false);
  };

  const header = (
    <View style={styles.headRow}>
      <View style={styles.flex}>
        <AppText variant="largeTitle" accessibilityRole="header">Pantry</AppText>
        <AppText variant="subhead">What you already have</AppText>
      </View>
      {count > 0 ? <TextButton label={editing ? 'Done' : 'Edit'} onPress={() => setEditing((e) => !e)} /> : null}
      <IconButton icon={adding ? 'close' : 'add'} label={adding ? 'Close add item' : 'Add an item'} onPress={() => (adding ? closeAdd() : setAdding(true))} />
    </View>
  );

  return (
    <TabScreen tab="pantry" header={header}>
      {adding ? (
        <Reveal>
          <Card style={styles.addCard}>
            <TextInput
              autoFocus
              accessibilityLabel="New pantry item"
              placeholder="Add an item, like brown rice"
              placeholderTextColor={c.muted}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submit}
              returnKeyType="done"
              blurOnSubmit={false}
              style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.control }]}
            />
            {draftHits.length > 0 ? (
              <View style={[styles.note, { backgroundColor: c.warnBg }]} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={16} color={c.warn} />
                <AppText variant="footnote" color={c.warn} weight="600" style={styles.flex}>
                  {`This looks like it contains ${draftHits.join(' and ').toLowerCase()}, which you avoid.`}
                </AppText>
              </View>
            ) : null}
            <View style={styles.pickRow} accessibilityRole="radiogroup" accessibilityLabel="Shelf">
              {SHELVES.map((s) => {
                const on = shelf === s.name;
                return (
                  <Pressable
                    key={s.name}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    onPress={() => {
                      haptic.select();
                      setShelf(s.name);
                    }}
                    style={[styles.pick, { backgroundColor: on ? c.primary : c.bg, borderColor: on ? c.primary : c.control }]}
                  >
                    <Ionicons name={s.icon} size={15} color={on ? c.onPrimary : c.text} />
                    <AppText variant="subhead" weight="600" color={on ? c.onPrimary : c.text}>{s.name}</AppText>
                  </Pressable>
                );
              })}
            </View>
            {suggestions.length > 0 ? (
              <View style={styles.quick}>
                <AppText variant="eyebrow">Many kitchens have</AppText>
                <View style={styles.chips}>
                  {suggestions.map((s) => {
                    const hits = allergensIn(s.name, allergies);
                    return (
                      <PressableScale
                        key={s.name}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${s.name} to ${s.shelf}${hits.length ? `. Contains ${hits.join(' and ').toLowerCase()}, which you avoid` : ''}`}
                        to={0.93}
                        onPress={() => quickAdd(s.name, s.shelf)}
                        style={[styles.suggest, { borderColor: hits.length ? c.warn : c.control, backgroundColor: hits.length ? c.warnBg : 'transparent' }]}
                      >
                        <Ionicons name={hits.length ? 'alert-circle' : 'add'} size={14} color={hits.length ? c.warn : c.primaryText} />
                        <AppText variant="subhead" color={hits.length ? c.warn : c.text}>{s.name}</AppText>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            ) : null}
            <View style={styles.addActions}>
              <TextButton label="Done" onPress={closeAdd} />
            </View>
          </Card>
        </Reveal>
      ) : null}

      {count > 0 && !adding ? (
        <Reveal>
          <View style={[styles.summary, { backgroundColor: c.tint }]}>
            <View style={styles.summaryText}>
              <AppText style={[styles.summaryNum, { color: c.primaryText }]}>{count}</AppText>
              <AppText variant="headline">{count === 1 ? 'item on hand' : 'items on hand'}</AppText>
              <AppText variant="subhead" color={c.text}>
                {pantrySavings > 0
                  ? `Kept off your list, saving about ${money(pantrySavings)} this week.`
                  : 'Kavi leaves these off your grocery list.'}
              </AppText>
            </View>
            <Mascot pose="yum" size={104} tappable label="Pip, Kavi's jar, enjoying a snack" style={styles.pip} />
          </View>
        </Reveal>
      ) : null}

      {flagged.length > 0 ? (
        <Reveal>
          <View style={[styles.warnCard, { backgroundColor: c.warnBg }]} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={20} color={c.warn} style={styles.warnIcon} />
            <View style={styles.flex}>
              <AppText variant="headline" color={c.warn}>
                {flagged.length === 1 ? '1 item has an allergen you avoid' : `${flagged.length} items have allergens you avoid`}
              </AppText>
              <AppText variant="subhead" color={c.warn}>
                {flagged.map((f) => `${f.item} (${f.hits.join(', ').toLowerCase()})`).join(', ')}.
              </AppText>
              <AppText variant="footnote" color={c.warn}>
                Kavi checks item names only. Read every label, since products can hide allergens, and keep these away from anyone who is allergic.
              </AppText>
            </View>
          </View>
        </Reveal>
      ) : null}

      {count === 0 && !adding ? (
        <View style={styles.empty}>
          <Mascot pose="peek" size={120} tappable decorative />
          <AppText variant="headline">Your pantry is empty</AppText>
          <AppText variant="subhead" style={styles.center}>
            Add what you already have, like rice or olive oil, and Kavi leaves it off your grocery list.
          </AppText>
          <TextButton label="Add an Item" onPress={() => setAdding(true)} />
        </View>
      ) : null}

      {editing ? <AppText variant="footnote" style={styles.editHint}>Tap an item to remove it.</AppText> : null}

      {pantry
        .filter((s) => s.items.length > 0)
        .map((s) => (
          <View key={s.name} style={styles.shelfGroup}>
            <View style={styles.shelfHead}>
              <Ionicons name={shelfIcon(s.name)} size={16} color={c.primaryText} />
              <AppText style={styles.shelfName} accessibilityRole="header">{s.name}</AppText>
              {flagged.some((f) => f.shelf === s.name) ? (
                <View style={styles.shelfWarn}>
                  <Ionicons name="alert-circle" size={15} color={c.warn} />
                  <AppText variant="footnote" weight="700" color={c.warn}>{flagged.filter((f) => f.shelf === s.name).length}</AppText>
                </View>
              ) : null}
              <AppText variant="subhead" style={styles.shelfCount}>{s.items.length}</AppText>
            </View>
            <View style={styles.items}>
              {s.items.map((item, i) => {
                const hits = allergensIn(item, allergies);
                const bad = hits.length > 0;
                return (
                  <Wiggle key={item} active={editing} seed={i}>
                    <PressableScale
                      accessibilityRole={editing ? 'button' : 'text'}
                      accessibilityLabel={
                        editing
                          ? `Remove ${item}`
                          : bad
                            ? `${item}. Contains ${hits.join(' and ').toLowerCase()}, which you avoid`
                            : item
                      }
                      accessibilityHint={editing ? undefined : 'Press and hold to edit the shelf'}
                      to={0.92}
                      // Press and hold starts editing, like rearranging icons on the iOS home screen.
                      onLongPress={() => {
                        if (editing) return;
                        haptic.success();
                        setEditing(true);
                      }}
                      onPress={() => {
                        if (!editing) return;
                        haptic.tap();
                        animateLayout();
                        removePantryItem(s.name, item);
                      }}
                      style={({ pressed }) => [
                        styles.item,
                        {
                          backgroundColor: bad ? c.warnBg : c.card,
                          borderColor: bad ? c.warn : editing ? c.control : 'transparent',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      {bad ? <Ionicons name="alert-circle" size={16} color={c.warn} /> : null}
                      <View>
                        <AppText style={[styles.itemText, bad && { color: c.warn }]}>{item}</AppText>
                        {bad ? (
                          <AppText variant="footnote" weight="600" color={c.warn} style={styles.itemHit}>
                            {`Contains ${hits.join(', ').toLowerCase()}`}
                          </AppText>
                        ) : null}
                      </View>
                      {editing ? <Ionicons name="close" size={14} color={bad ? c.warn : c.text} /> : null}
                    </PressableScale>
                  </Wiggle>
                );
              })}
            </View>
            <Image
              source={require('../../../assets/shelves/shelf1.png')}
              style={styles.shelf}
              resizeMode="stretch"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
        ))}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  center: { textAlign: 'center' },
  addCard: { padding: 14, gap: 12 },
  input: { minHeight: 46, borderWidth: 1.5, borderRadius: radius.control, paddingHorizontal: 12, fontSize: 17, fontFamily: fonts.regular },
  pickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: { minHeight: 36, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  quick: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggest: { minHeight: 36, paddingLeft: 8, paddingRight: 12, borderRadius: radius.pill, borderWidth: 1.5, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 4 },
  addActions: { alignItems: 'flex-end' },
  summary: { borderRadius: radius.card, paddingLeft: 16, paddingRight: 6, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  summaryText: { flex: 1, gap: 2 },
  summaryNum: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  pip: { marginVertical: -8 },
  editHint: { paddingHorizontal: 6 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.control },
  warnCard: { borderRadius: radius.card, padding: 14, flexDirection: 'row', gap: 10, marginBottom: 6 },
  warnIcon: { marginTop: 1 },
  shelfWarn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  itemHit: { marginTop: -1 },
  shelfGroup: { gap: 6, marginBottom: 12 },
  shelfHead: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 6 },
  shelfName: { fontFamily: fonts.displaySemi, fontSize: 19, lineHeight: 24, letterSpacing: -0.2, flex: 1 },
  shelfCount: { fontVariant: ['tabular-nums'] },
  items: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 8 },
  item: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#13241A',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  itemText: { fontSize: 15, fontWeight: '500' },
  shelf: { width: '100%', height: 30, marginTop: -2 },
});
