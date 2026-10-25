import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, IconButton, PrimaryButton } from '../../components/Buttons';
import { Chip } from '../../components/Controls';
import { OnboardingShell } from '../../components/OnboardingShell';
import { ALLERGIES, DISLIKES } from '../../data/mock';
import { useApp } from '../../state/AppState';
import { fonts, radius, useTheme } from '../../theme';

export default function Household() {
  const c = useTheme();
  const app = useApp();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  // The typed amount is kept as text while editing, then clamped to $50 to $400 when committed.
  const [draft, setDraft] = useState(String(app.budget));
  useEffect(() => setDraft(String(app.budget)), [app.budget]);
  // Live regions only work on Android, so announce the new count for VoiceOver too.
  const changePeople = (delta: number) => {
    const next = Math.min(12, Math.max(1, app.people + delta));
    app.setPeople(next);
    AccessibilityInfo.announceForAccessibility(`${next} people`);
  };
  const commitBudget = () => {
    const n = Math.min(400, Math.max(50, Number(draft) || app.budget));
    app.setBudget(n);
    setDraft(String(n));
  };

  return (
    <OnboardingShell
      step={2}
      backLabel={edit ? 'Back to Settings' : 'Back to step 1'}
      title="Set Up Your Household"
      intro="Kavi uses this to size portions and keep each week under budget."
      footer={
        <PrimaryButton
          label={edit ? 'Done' : 'Continue'}
          onPress={() => {
            commitBudget();
            if (edit) router.back();
            else router.push('/onboarding/save');
          }}
        />
      }
    >
      <Card style={styles.rowCard}>
        <View style={styles.flex}>
          <AppText variant="headline">People eating dinner</AppText>
          <AppText variant="subhead">Adults and kids</AppText>
        </View>
        <View style={styles.stepper}>
          <IconButton icon="remove" label="Fewer people" onPress={() => changePeople(-1)} />
          <AppText
            accessibilityLabel={`${app.people} people`}
            accessibilityLiveRegion="polite"
            style={[styles.count, { fontFamily: fonts.displaySemi }]}
          >
            {app.people}
          </AppText>
          <IconButton icon="add" label="More people" onPress={() => changePeople(1)} />
        </View>
      </Card>

      <Card style={styles.budgetCard}>
        <View style={styles.budgetHead}>
          <AppText variant="headline" style={styles.flex} nativeID="budgetLabel">
            Weekly grocery budget
          </AppText>
          <View style={[styles.amount, { borderColor: c.control }]}>
            <AppText style={[styles.amountText, { fontFamily: fonts.displaySemi }]}>$</AppText>
            <TextInput
              accessibilityLabel="Weekly grocery budget in dollars"
              value={draft}
              onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
              onBlur={commitBudget}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={3}
              style={[styles.amountText, styles.input, { color: c.text, fontFamily: fonts.displaySemi }]}
            />
          </View>
        </View>
        <Slider
          accessibilityLabel="Weekly grocery budget slider"
          minimumValue={50}
          maximumValue={400}
          step={10}
          value={app.budget}
          onValueChange={(v) => setDraft(String(v))}
          onSlidingComplete={(v) => app.setBudget(v)}
          minimumTrackTintColor={c.primary}
          maximumTrackTintColor={c.track}
          style={styles.slider}
        />
        <View style={styles.scale}>
          <AppText variant="footnote">$50</AppText>
          <AppText variant="footnote">Tap the amount to type it</AppText>
          <AppText variant="footnote">$400</AppText>
        </View>
      </Card>

      <View style={styles.group}>
        <AppText variant="eyebrow" accessibilityRole="header">Allergies, always avoided</AppText>
        <View style={styles.chips}>
          {ALLERGIES.map((a) => (
            <Chip key={a} label={a} selected={app.allergies.includes(a)} onPress={() => app.toggleAllergy(a)} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="eyebrow" accessibilityRole="header">Dislikes, avoided when possible</AppText>
        <View style={styles.chips}>
          {DISLIKES.map((d) => (
            <Chip key={d} label={d} selected={app.dislikes.includes(d)} onPress={() => app.toggleDislike(d)} />
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { width: 40, textAlign: 'center', fontSize: 24, fontVariant: ['tabular-nums'] },
  budgetCard: { padding: 16, gap: 8 },
  budgetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderRadius: radius.control,
  },
  amountText: { fontSize: 20 },
  input: { minWidth: 44, padding: 0, fontVariant: ['tabular-nums'] },
  slider: { height: 44 },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  group: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
