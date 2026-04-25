import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../lib/auth";
import {
  fetchBackloggdUser,
  type BackloggdUserContent,
} from "../../lib/backloggdApi";

export default function Index() {
  const { session, signOut, backloggdUsername } = useAuth();
  const [backloggdUser, setBackloggdUser] =
    useState<BackloggdUserContent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!backloggdUsername) {
        setBackloggdUser(null);
        return;
      }

      setLoadingProfile(true);
      setError(null);
      try {
        const user = await fetchBackloggdUser(backloggdUsername);
        setBackloggdUser(user);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile data.");
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [backloggdUsername]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.muted}>
          Signed in as{" "}
          <Text style={styles.mono}>
            {session?.user?.email ?? session?.user?.id ?? "Unknown"}
          </Text>
        </Text>

        <Text style={styles.sectionLabel}>Username</Text>
        <Text style={styles.sectionValue}>
          {backloggdUser?.username ?? backloggdUsername ?? "Not set"}
        </Text>

        <Text style={styles.sectionLabel}>Bio</Text>
        <Text style={styles.bioValue}>
          {backloggdUser?.bio ?? "No bio yet."}
        </Text>

        <Text style={styles.sectionLabel}>Favorite games</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {!backloggdUser?.favoriteGames?.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No favorite games yet</Text>
            </View>
          ) : (
            backloggdUser.favoriteGames.map((game) => (
              <View key={`favorite-${game.name}`} style={styles.gameCard}>
                <Image source={{ uri: game.image }} style={styles.gameImage} />
                <Text numberOfLines={2} style={styles.gameName}>
                  {game.name}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {loadingProfile ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.muted}>Loading profile data...</Text>
          </View>
        ) : null}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16181c",
  },
  content: {
    alignItems: "center",
    padding: 18,
    paddingBottom: 28,
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
  sectionLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  sectionValue: {
    color: "#ffffff",
    fontSize: 15,
  },
  bioValue: {
    color: "#e5e7eb",
    lineHeight: 20,
  },
  gameCard: {
    width: 120,
    marginTop: 8,
    marginRight: 10,
  },
  gameImage: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2f3542",
    marginBottom: 6,
  },
  gameName: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 16,
  },
  emptyCard: {
    marginTop: 8,
    height: 120,
    width: 190,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2f3542",
    backgroundColor: "#242832",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  emptyCardText: {
    color: "#9ba6bf",
    textAlign: "center",
  },
  loadingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
