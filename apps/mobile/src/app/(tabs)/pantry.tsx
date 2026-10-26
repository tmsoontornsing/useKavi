import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { IconButton, TextButton } from '../../components/Buttons';
import { TabScreen } from '../../components/TabScreen';
import { animateLayout, haptic, PressableScale, Reveal, Wiggle } from '../../motion';
import { useApp } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

export default function Pantry() {
  const c = useTheme();
  const { pantry, addPantryItem, removePantryItem } = useApp();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const count = pantry.reduce((n, s) => n + s.items.length, 0);

  // New items go on the Staples shelf until categories come from the backend.
  const submit = () => {
    const name = draft.trim();
    animateLayout();
    if (name) {
      haptic.success();
      addPantryItem('Staples', name);
    }
    setDraft('');
    setAdding(false);
  };

  const header = (
    <>
      <View style={styles.headRow}>
        <View style={styles.flex}>
          <AppText variant="largeTitle" accessibilityRole="header">Pantry</AppText>
          <AppText variant="subhead">{count} items on hand</AppText>
        </View>
        <TextButton label={editing ? 'Done' : 'Edit'} onPress={() => setEditing((e) => !e)} />
        <IconButton icon="add" label="Add an item" onPress={() => setAdding(true)} />
      </View>
      <AppText variant="subhead">Kavi plans around what’s here and leaves it off your grocery list.</AppText>
      {adding ? (
        <Reveal>
        <TextInput
          autoFocus
          accessibilityLabel="New pantry item"
          placeholder="Add an item, like brown rice"
          placeholderTextColor={c.muted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          onBlur={submit}
          returnKeyType="done"
          style={[styles.input, { backgroundColor: c.card, color: c.text, borderColor: c.control }]}
        />
        </Reveal>
      ) : null}
    </>
  );

  return (
    <TabScreen tab="pantry" header={header}>
      {pantry.map((shelf) => (
        <View key={shelf.name} style={styles.shelfGroup}>
          <AppText variant="eyebrow" accessibilityRole="header">{shelf.name}</AppText>
          <View style={styles.items}>
            {shelf.items.map((item, i) => (
              <Wiggle key={item} active={editing} seed={i}>
                <PressableScale
                  accessibilityRole={editing ? 'button' : 'text'}
                  accessibilityLabel={editing ? `Remove ${item}` : item}
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
                    removePantryItem(shelf.name, item);
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: c.card, borderColor: editing ? c.control : 'transparent', opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <AppText style={styles.itemText}>{item}</AppText>
                  {editing ? <Ionicons name="close" size={14} color={c.text} /> : null}
                </PressableScale>
              </Wiggle>
            ))}
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
  input: { minHeight: 44, borderWidth: 1.5, borderRadius: radius.control, paddingHorizontal: 12, fontSize: 17 },
  shelfGroup: { gap: 6, marginBottom: 12 },
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
