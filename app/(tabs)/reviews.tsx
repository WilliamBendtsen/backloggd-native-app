import { StyleSheet, Text, View } from "react-native";

export default function ReviewsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reviews screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16181c",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
  },
});
