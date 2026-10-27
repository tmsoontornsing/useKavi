import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, IconButton, PrimaryButton } from '../../components/Buttons';
import { Chip } from '../../components/Controls';
import { OnboardingShell } from '../../components/OnboardingShell';
import { goToStep } from '../../components/StepHeader';
import { ALLERGIES, DISLIKES, LIKES } from '../../data/mock';
import { useT } from '../../i18n';
import { useApp } from '../../state/AppState';
import { fonts, radius, useTheme } from '../../theme';

export default function Household() {
  const c = useTheme();
  const app = useApp();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { t, tn, tx } = useT();
  // The typed amount is kept as text while editing, then clamped to $50 to $400 when committed.
  const [draft, setDraft] = useState(String(app.budget));
  useEffect(() => setDraft(String(app.budget)), [app.budget]);
  // Live regions only work on Android, so announce the new count for VoiceOver too.
  const changePeople = (delta: number) => {
    const next = Math.min(12, Math.max(1, app.people + delta));
    app.setPeople(next);
    AccessibilityInfo.announceForAccessibility(tn(next, '{n} person', '{n} people'));
  };
  const commitBudget = () => {
    const n = Math.min(400, Math.max(50, Number(draft) || app.budget));
    app.setBudget(n);
    setDraft(String(n));
  };
  // Foods they like: the suggestions, plus anything they have typed in.
  const [food, setFood] = useState('');
  const likeChips = [...LIKES, ...app.likes.filter((l) => !LIKES.some((x) => x.toLowerCase() === l.toLowerCase()))];
  const addFood = () => {
    app.addLike(food);
    setFood('');
  };
  // Leaving through a tab or Back unmounts this screen with the keyboard possibly still open, so keep what was typed.
  const latest = useRef({ draft, budget: app.budget, setBudget: app.setBudget });
  latest.current = { draft, budget: app.budget, setBudget: app.setBudget };
  useEffect(
    () => () => {
      const { draft: d, budget, setBudget } = latest.current;
      const n = Math.min(400, Math.max(50, Number(d) || budget));
      if (n !== budget) setBudget(n);
    },
    [],
  );

  return (
    <OnboardingShell
      step={2}
      pip="love"
      backLabel={edit ? t('Back to Settings') : t('Back to step 1')}
      title={t('Set Up Your Household')}
      intro={t('Kavi uses this to size portions and keep each week under budget.')}
      footer={
        <PrimaryButton
          label={edit ? t('Done') : t('Continue')}
          onPress={() => {
            commitBudget();
            if (edit) router.back();
            else goToStep(2, 3);
          }}
        />
      }
    >
      <Card style={styles.rowCard}>
        <View style={styles.flex}>
          <AppText variant="headline">{t('People eating')}</AppText>
          <AppText variant="subhead">{t('Adults and kids')}</AppText>
        </View>
        <View style={styles.stepper}>
          <IconButton icon="remove" label={t('Fewer people')} onPress={() => changePeople(-1)} />
          <AppText
            accessibilityLabel={tn(app.people, '{n} person', '{n} people')}
            accessibilityLiveRegion="polite"
            style={[styles.count, { fontFamily: fonts.displaySemi }]}
          >
            {app.people}
          </AppText>
          <IconButton icon="add" label={t('More people')} onPress={() => changePeople(1)} />
        </View>
      </Card>

      <Card style={styles.budgetCard}>
        <View style={styles.budgetHead}>
          <AppText variant="headline" style={styles.flex} nativeID="budgetLabel">
            {t('Weekly grocery budget')}
          </AppText>
          <View style={[styles.amount, { borderColor: c.control }]}>
            <AppText style={[styles.amountText, { fontFamily: fonts.displaySemi }]}>$</AppText>
            <TextInput
              accessibilityLabel={t('Weekly grocery budget in dollars')}
              value={draft}
              onChangeText={(text) => setDraft(text.replace(/[^0-9]/g, ''))}
              onBlur={commitBudget}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={3}
              style={[styles.amountText, styles.input, { color: c.text, fontFamily: fonts.displaySemi }]}
            />
          </View>
        </View>
        <Slider
          accessibilityLabel={t('Weekly grocery budget slider')}
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
          <AppText variant="footnote">{t('Tap the amount to type it')}</AppText>
          <AppText variant="footnote">$400</AppText>
        </View>
      </Card>

      <View style={styles.group}>
        <AppText variant="eyebrow" accessibilityRole="header">{t('Allergies to avoid')}</AppText>
        <View style={styles.chips}>
          {ALLERGIES.map((a) => (
            <Chip key={a} label={tx(a)} selected={app.allergies.includes(a)} onPress={() => app.toggleAllergy(a)} />
          ))}
        </View>
        <View style={[styles.allergyNote, { backgroundColor: c.warnBg }]}>
          <AppText variant="footnote" color={c.warn}>
            {t('Kavi leaves out recipes tagged with these allergens, but tags can be wrong and products vary by brand. Always read labels, and check every ingredient yourself if an allergy is severe.')}
          </AppText>
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="eyebrow" accessibilityRole="header">{t('Dislikes, avoided when possible')}</AppText>
        <View style={styles.chips}>
          {DISLIKES.map((d) => (
            <Chip key={d} label={tx(d)} selected={app.dislikes.includes(d)} onPress={() => app.toggleDislike(d)} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="eyebrow" accessibilityRole="header">{t('Foods you like')}</AppText>
        <View style={styles.chips}>
          {likeChips.map((f) => (
            <Chip key={f} label={tx(f)} selected={app.likes.includes(f)} onPress={() => app.toggleLike(f)} />
          ))}
        </View>
        <TextInput
          accessibilityLabel={t('Add another food you like')}
          placeholder={t('Add another, like pad thai')}
          placeholderTextColor={c.muted}
          value={food}
          onChangeText={setFood}
          onSubmitEditing={addFood}
          returnKeyType="done"
          autoCapitalize="sentences"
          style={[styles.foodInput, { backgroundColor: c.card, color: c.text, borderColor: c.control }]}
        />
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
  allergyNote: { borderRadius: radius.row, paddingHorizontal: 12, paddingVertical: 10 },
  foodInput: { minHeight: 44, borderWidth: 1.5, borderRadius: radius.control, paddingHorizontal: 12, fontSize: 17, fontFamily: fonts.regular },
});
