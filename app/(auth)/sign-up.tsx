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

export default function SignUpScreen() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSignUp = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        username: username.trim(),
      });
      setSuccess(
        "Account created. If email confirmations are enabled, check your inbox to confirm your address.",
      );
    } catch (e: any) {
      setError(e?.message ?? "Sign-up failed.");
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
        <Text style={styles.title}>Create account</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
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
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Pressable
          onPress={onSignUp}
          disabled={
            submitting ||
            !username.trim() ||
            !email.trim() ||
            password.length < 6
          }
          style={({ pressed }) => [
            styles.button,
            (submitting ||
              !username.trim() ||
              !email.trim() ||
              password.length < 6) &&
              styles.buttonDisabled,
            pressed && !submitting && styles.buttonPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#0b0e12" />
          ) : (
            <Text style={styles.buttonText}>Sign up</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Link href="/(auth)/sign-in" style={styles.link}>
            Sign in
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
  success: {
    color: "#86efac",
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
