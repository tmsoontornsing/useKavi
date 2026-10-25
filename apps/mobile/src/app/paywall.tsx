import { StyleSheet, Text, View } from 'react-native';

// Placeholder: RevenueCat paywall goes here.
export default function PaywallScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.body}>Kavi Plus subscriptions coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  body: { fontSize: 16, color: '#444' },
});
