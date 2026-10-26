import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Card, PrimaryButton, TextButton } from '../../components/Buttons';
import { KaviSwitch } from '../../components/Controls';
import { OnboardingShell } from '../../components/OnboardingShell';
import { applianceName, DIETS } from '../../data/mock';
import { resetTo } from '../../navigation';
import { useApp } from '../../state/AppState';
import { radius, useTheme } from '../../theme';

const looksLikeEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s.trim());

export default function Save() {
  const c = useTheme();
  const app = useApp();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const dietName = DIETS.find((d) => d.id === app.diet)?.name ?? 'Everything';
  const avoiding = app.allergies.length ? app.allergies.join(', ') : 'Nothing';
  const kitchen = app.appliances.length ? app.appliances.map(applianceName).join(', ') : 'Nothing yet';

  // Sign-in by emailed code: enter an email, then the 6-digit code from the message.
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => {
    if (!looksLikeEmail(email)) {
      setError('Enter an email address like name@example.com.');
      return;
    }
    run(async () => {
      await app.sendSignInCode(email);
      setCode('');
      setCodeSent(true);
    });
  };

  const verify = () => {
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    run(async () => {
      await app.verifySignInCode(email, code);
      resetTo('/week');
    });
  };

  const summary: [string, string][] = [
    ['Diet', dietName],
    ['People', String(app.people)],
    ['Weekly budget', `$${app.budget}`],
    ['Avoiding', avoiding],
    ['Kitchen', kitchen],
  ];

  const input = [styles.input, { backgroundColor: c.card, color: c.text, borderColor: c.control }];

  const liveFooter = codeSent ? (
    <>
      <AppText variant="subhead">{`Enter the 6-digit code we sent to ${email.trim()}.`}</AppText>
      <TextInput
        accessibilityLabel="Sign-in code"
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ''))}
        onSubmitEditing={verify}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        placeholder="123456"
        placeholderTextColor={c.muted}
        style={[input, styles.code]}
      />
      <PrimaryButton label={busy ? 'Signing In…' : 'Sign In'} onPress={busy ? () => {} : verify} />
      <View style={styles.row}>
        <TextButton label="Use a Different Email" bold={false} onPress={() => setCodeSent(false)} />
        <TextButton label="Send a New Code" bold={false} onPress={sendCode} />
      </View>
    </>
  ) : (
    <>
      <TextInput
        accessibilityLabel="Email address"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={sendCode}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        placeholder="you@example.com"
        placeholderTextColor={c.muted}
        style={input}
      />
      <PrimaryButton label={busy ? 'Sending…' : 'Email Me a Code'} onPress={busy ? () => {} : sendCode} />
    </>
  );

  return (
    <OnboardingShell
      step={4}
      backLabel={from === 'welcome' ? 'Back to welcome' : 'Back to step 3'}
      title="Save Your Plan"
      intro={
        app.live
          ? 'Sign in with your email so your household settings are saved and your grocery list can be shared.'
          : 'This build runs on example data, so nothing is saved yet.'
      }
      footer={
        <>
          {app.live ? (
            liveFooter
          ) : (
            <PrimaryButton
              label="Continue"
              onPress={() => {
                app.signIn();
                resetTo('/week');
              }}
            />
          )}
          {error ? (
            <AppText variant="subhead" color={c.warn} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <AppText variant="footnote" style={styles.center}>
            Kavi only uses your account to save settings and sync your list.
          </AppText>
        </>
      }
    >
      <Card style={styles.summary}>
        {summary.map(([k, v], i) => (
          <View
            key={k}
            style={[styles.summaryRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}
          >
            <AppText>{k}</AppText>
            <AppText color={c.muted} style={styles.value} numberOfLines={2}>{v}</AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.remind}>
        <View style={styles.flex}>
          <AppText variant="headline">Sunday reminder</AppText>
          <AppText variant="subhead">
            A note at 5 PM when next week’s plan is ready. iOS asks for permission when you turn this on.
          </AppText>
        </View>
        <KaviSwitch label="Sunday reminder" value={app.remindSunday} onValueChange={app.setRemindSunday} />
      </Card>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  summary: { paddingHorizontal: 16, paddingVertical: 4 },
  summaryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  value: { flexShrink: 1, textAlign: 'right' },
  remind: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { minHeight: 52, borderWidth: 1.5, borderRadius: radius.control, paddingHorizontal: 14, fontSize: 17 },
  code: { fontSize: 24, letterSpacing: 6, textAlign: 'center', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  center: { textAlign: 'center', paddingBottom: 4 },
});
