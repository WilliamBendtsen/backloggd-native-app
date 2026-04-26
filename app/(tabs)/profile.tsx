import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getAvatarPublicUrl, getProfile, uploadAvatar } from "../../lib/profiles";
import { searchTwitchGames, type TwitchGame } from "../../lib/twitchProxy";

export default function Index() {
  const router = useRouter();
  const { signOut, backloggdUsername, session } = useAuth();
  const [backloggdUser, setBackloggdUser] =
    useState<BackloggdUserContent | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const userId = session?.user?.id;

      if (!backloggdUsername || !userId) {
        setBackloggdUser(null);
        setAvatarUri(null);
        return;
      }

      setLoadingProfile(true);
      setError(null);
      try {
        const [user, profile] = await Promise.all([
          fetchBackloggdUser(backloggdUsername),
          getProfile(userId),
        ]);

        setAvatarUri(getAvatarPublicUrl(profile?.avatar_path ?? null));
        setBackloggdUser(user);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile data.");
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [backloggdUsername, session?.user?.id]);

  const pickAvatarImage = async () => {
    const userId = session?.user?.id;

    if (!userId) {
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setError("Photo library access is required to choose an avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const asset = result.assets[0];
      if (!asset.base64) {
        throw new Error("Image data could not be prepared for upload.");
      }

      const uploaded = await uploadAvatar({
        userId,
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType,
      });

      setAvatarUri(uploaded.publicUrl);
    } catch (e: any) {
      const message = e?.message ?? "Failed to upload avatar.";
      setError(message);
      Alert.alert("Avatar upload failed", message);
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  function renderStars(rating: number) {
    const roundedRating = Math.max(1, Math.min(5, Math.round(rating)));

    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const iconName = starNumber <= roundedRating ? "star" : "star-outline";

      return (
        <Ionicons
          key={`star-${starNumber}`}
          name={iconName}
          size={14}
          color="#f5c84c"
          style={styles.starIcon}
        />
      );
    });
  }

  function normalizeName(value: string) {
    return value.trim().toLowerCase();
  }

  function pickBestMatch(name: string, candidates: TwitchGame[]) {
    const target = normalizeName(name);

    const exact = candidates.find(
      (candidate) => normalizeName(candidate.name ?? "") === target,
    );
    if (exact) {
      return exact;
    }

    const partial = candidates.find((candidate) =>
      normalizeName(candidate.name ?? "").includes(target),
    );
    if (partial) {
      return partial;
    }

    return candidates[0];
  }

  async function openFavoriteGame(name: string, fallbackImage: string) {
    try {
      const searchResults = await searchTwitchGames(name);
      const matched = pickBestMatch(name, searchResults);

      router.push({
        pathname: "/game",
        params: {
          id: String(matched?.id ?? name),
          name: matched?.name ?? name,
          coverUrl: matched?.coverUrl ?? fallbackImage,
          genreName: matched?.genreName ?? "Unknown genre",
          releaseDate: matched?.releaseDate ?? "Unknown release date",
          publisherName: matched?.publisherName ?? "Unknown publisher",
          developerName: matched?.developerName ?? "Unknown developer",
          platformName: matched?.platformName ?? "Unknown platform",
        },
      });
    } catch {
      router.push({
        pathname: "/game",
        params: {
          id: name,
          name,
          coverUrl: fallbackImage,
          genreName: "Unknown genre",
          releaseDate: "Unknown release date",
          publisherName: "Unknown publisher",
          developerName: "Unknown developer",
          platformName: "Unknown platform",
        },
      });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.sectionValue}>
              {backloggdUser?.username ?? backloggdUsername ?? "Not set"}
            </Text>
          </View>

          <Pressable
            onPress={pickAvatarImage}
            accessibilityRole="button"
            accessibilityLabel="Choose profile picture"
            disabled={uploadingAvatar}
            style={({ pressed }) => [
              styles.avatarButton,
              (pressed || uploadingAvatar) && styles.avatarButtonPressed,
            ]}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarEmptyState}>
                <Ionicons name="camera" size={24} color="#d7deef" />
              </View>
            )}
          </Pressable>
        </View>

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
              <Pressable
                key={`favorite-${game.name}`}
                onPress={() => openFavoriteGame(game.name, game.image)}
                style={({ pressed }) => [
                  styles.gameCard,
                  pressed && styles.gameCardPressed,
                ]}
              >
                <Image source={{ uri: game.image }} style={styles.gameImage} />
                <Text numberOfLines={2} style={styles.gameName}>
                  {game.name}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <Text style={styles.sectionLabel}>Recently played</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {!backloggdUser?.recentlyReviewed?.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No reviews yet</Text>
            </View>
          ) : (
            backloggdUser.recentlyReviewed.map((item) => (
              <View key={`review-${item.name}`} style={styles.reviewCard}>
                <View style={styles.reviewImageWrap}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.reviewImage}
                    resizeMode="contain"
                  />
                </View>
                <Text numberOfLines={2} style={styles.reviewTitle}>
                  {item.name}
                </Text>
                <View style={styles.ratingRow}>{renderStars(item.rating)}</View>
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewLink}>See review</Text>
                  <Ionicons name="chevron-forward" size={16} color="#d7deef" />
                </View>
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

        {uploadingAvatar ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.muted}>Uploading avatar...</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  muted: {
    color: "#9ca3af",
  },
  avatarButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#2f3542",
    backgroundColor: "#1d222c",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarButtonPressed: {
    opacity: 0.85,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarEmptyState: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    color: "#cbd5e1",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
  },
  sectionValue: {
    color: "#ffffff",
    fontSize: 30,
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
  gameCardPressed: {
    opacity: 0.85,
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
  reviewCard: {
    width: 220,
    marginTop: 8,
    marginRight: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2f3542",
    backgroundColor: "#242832",
  },
  reviewImageWrap: {
    height: 220,
    borderRadius: 8,
    backgroundColor: "#1d222c",
    borderWidth: 1,
    borderColor: "#2f3542",
    overflow: "hidden",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewImage: {
    width: "100%",
    height: "100%",
  },
  reviewTitle: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    paddingRight: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 10,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2f3542",
  },
  reviewLink: {
    color: "#d7deef",
    fontSize: 13,
    fontWeight: "700",
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
