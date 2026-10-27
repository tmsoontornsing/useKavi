import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Card, IconButton, TextButton } from '../../components/Buttons';
import { LEGAL } from '../../legal/config';
import { LEGAL_DOCS, type Block } from '../../legal/documents';
import { modalEdges, openUrl } from '../../navigation';
import { radius, space, useTheme } from '../../theme';

// The Terms of Service or Privacy Policy, readable without leaving the app or needing a connection.
// Presented as a sheet so it opens the same way over the paywall, sign-up, or Settings.
export default function LegalScreen() {
  const c = useTheme();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = doc === 'privacy' ? LEGAL_DOCS.privacy : LEGAL_DOCS.terms;
  const other = content.id === 'terms' ? LEGAL_DOCS.privacy : LEGAL_DOCS.terms;

  return (
    <SafeAreaView edges={modalEdges} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.top}>
        <AppText variant="headline" style={styles.flex} accessibilityRole="header">{content.title}</AppText>
        <IconButton icon="close" label={`Close ${content.title}`} onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.summary, { backgroundColor: c.tint }]}>
          <AppText variant="eyebrow" color={c.primaryText}>The short version</AppText>
          <AppText color={c.text}>{content.summary}</AppText>
        </Card>
        {content.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
        <View style={styles.links}>
          <TextButton label={`Read the ${other.title}`} onPress={() => router.setParams({ doc: other.id })} />
          <TextButton
            label="Open on the Web"
            bold={false}
            color={c.muted}
            onPress={() => openUrl(content.id === 'terms' ? LEGAL.termsUrl : LEGAL.privacyUrl)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BlockView({ block }: { block: Block }) {
  const c = useTheme();
  if ('h' in block) {
    return (
      <AppText variant="headline" accessibilityRole="header" style={styles.heading}>
        {block.h}
      </AppText>
    );
  }
  if ('p' in block) return <AppText color={c.text} style={styles.para}>{block.p}</AppText>;
  return (
    <View style={styles.list}>
      {block.list.map((item) => {
        // Items that open with a short label ("Billing. ...") show the label in bold.
        const m = item.match(/^([A-Z][^.]{2,40}\.)\s(.*)$/s);
        return (
          <View key={item} style={styles.item}>
            <View style={[styles.bullet, { backgroundColor: c.primary }]} />
            <AppText color={c.text} style={[styles.flex, styles.para]}>
              {m ? (
                <>
                  <AppText weight="600" color={c.text}>{m[1]}</AppText>
                  {` ${m[2]}`}
                </>
              ) : (
                item
              )}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 8 },
  content: { paddingHorizontal: space.gutter, paddingBottom: 40, gap: 12 },
  summary: { padding: 16, gap: 6, borderRadius: radius.card, marginBottom: 4 },
  heading: { marginTop: 12 },
  para: { fontSize: 16, lineHeight: 23 },
  list: { gap: 10 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  links: { marginTop: 16, alignItems: 'flex-start', gap: 4 },
});
