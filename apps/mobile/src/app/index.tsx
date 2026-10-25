import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder home screen. Plan generation and data fetching come in later steps.
export default function PlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your dinners this week</Text>
      <Text style={styles.body}>No plan yet. Set up your household to generate one.</Text>
      <Link href="/onboarding" style={styles.link}>Set up Kavi</Link>
      <Link href="/grocery" style={styles.link}>Grocery list</Link>
      <Link href="/paywall" style={styles.link}>See Kavi Plus</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600' },
  body: { fontSize: 16, color: '#444' },
  link: { fontSize: 16, color: '#0a7ea4', paddingVertical: 8 },
});
