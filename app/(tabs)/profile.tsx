import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../lib/auth";

export default function Index() {
  const { session, signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignOut = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signOut();
    } catch (e: any) {
      setError(e?.message ?? "Sign out failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.muted}>
          Signed in as{" "}
          <Text style={styles.mono}>
            {session?.user?.email ?? session?.user?.id ?? "Unknown"}
          </Text>
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSignOut}
          disabled={submitting}
          style={({ pressed }) => [
            styles.button,
            submitting && styles.buttonDisabled,
            pressed && !submitting && styles.buttonPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#0b0e12" />
          ) : (
            <Text style={styles.buttonText}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16181c",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#0f1115",
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#22262e",
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  muted: {
    color: "#9ca3af",
  },
  mono: {
    color: "#ffffff",
    fontWeight: "700",
  },
  error: {
    color: "#f87171",
  },
  button: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#0b0e12",
    fontWeight: "800",
    fontSize: 15,
  },
});
