import { StyleSheet, Text, View } from 'react-native';

// Placeholder: aisle-grouped grocery list goes here.
export default function GroceryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.body}>Your grocery list will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  body: { fontSize: 16, color: '#444' },
});
