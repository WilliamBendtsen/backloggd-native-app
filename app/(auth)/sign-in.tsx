import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../lib/auth";

export default function SignInScreen() {
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPassword({
        email: email.trim(),
        password,
      });
    } catch (e: any) {
      setError(e?.message ?? "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Sign in with your email and password.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#6b7280"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSignIn}
          disabled={submitting || !email.trim() || !password}
          style={({ pressed }) => [
            styles.button,
            (submitting || !email.trim() || !password) && styles.buttonDisabled,
            pressed && !submitting && styles.buttonPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#0b0e12" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          No account?{" "}
          <Link href="/(auth)/sign-up" style={styles.link}>
            Create one
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0e12",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#16181c",
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 6,
  },
  field: {
    gap: 6,
    marginTop: 6,
  },
  label: {
    color: "#cbd5e1",
    fontWeight: "600",
  },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#0f1115",
    borderWidth: 1,
    borderColor: "#22262e",
    color: "#ffffff",
  },
  error: {
    color: "#f87171",
    marginTop: 4,
  },
  button: {
    height: 46,
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
    fontSize: 16,
  },
  footer: {
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "center",
  },
  link: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
