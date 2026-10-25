import { StyleSheet, Text, View } from 'react-native';

// Placeholder: household size, weekly budget, allergies, and dislikes form goes here.
export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.body}>Household setup coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  body: { fontSize: 16, color: '#444' },
});
