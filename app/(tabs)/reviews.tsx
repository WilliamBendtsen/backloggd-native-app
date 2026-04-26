import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../lib/auth";
import {
  listAllReviews,
  listProfilesByIds,
  type ReviewRow,
} from "../../lib/reviews";

function truncateBody(value: string, maxLength = 220) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

export default function ReviewsScreen() {
  const { session, backloggdUsername } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [authorNamesById, setAuthorNamesById] = useState<Record<string, string>>(
    {},
  );
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const avatarStorageKey = backloggdUsername
    ? `profile-avatar:${backloggdUsername}`
    : null;

  useEffect(() => {
    async function loadReviews() {
      const userId = session?.user?.id;

      if (!userId) {
        setReviews([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const savedAvatarUri = avatarStorageKey
          ? await AsyncStorage.getItem(avatarStorageKey)
          : null;

        setAvatarUri(savedAvatarUri);

        const nextReviews = await listAllReviews();
        const profiles = await listProfilesByIds(
          nextReviews.map((review) => review.user_id),
        );
        const nextAuthorNamesById = Object.fromEntries(
          profiles.map((profile) => [
            profile.id,
            profile.display_name?.trim() || profile.username,
          ]),
        );

        setReviews(nextReviews);
        setAuthorNamesById(nextAuthorNamesById);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [avatarStorageKey, session?.user?.id]);

  function renderStars(rating: number) {
    const roundedRating = Math.max(1, Math.min(5, Math.round(rating)));

    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const iconName = starNumber <= roundedRating ? "star" : "star-outline";

      return (
        <Ionicons
          key={`rating-star-${starNumber}`}
          name={iconName}
          size={14}
          color="#f5c84c"
          style={styles.starIcon}
        />
      );
    });
  }

  function formatAuthor(review: ReviewRow) {
    if (review.user_id === session?.user?.id) {
      return authorNamesById[review.user_id] ?? backloggdUsername ?? "You";
    }

    return (
      authorNamesById[review.user_id] ?? `User ${review.user_id.slice(0, 8)}`
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Reviews</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#80a3ff" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && reviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
        </View>
      ) : null}

      {!loading && !error
        ? reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTopRow}>
                <View style={styles.reviewerIdentity}>
                  <View style={styles.avatarWrap}>
                    {review.user_id === session?.user?.id && avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={18} color="#d7deef" />
                    )}
                  </View>
                  <Text style={styles.usernameText} numberOfLines={1}>
                    {formatAuthor(review)}
                  </Text>
                </View>
              </View>

              <Text style={styles.reviewTitle}>{review.game_name}</Text>

              <View style={styles.ratingRow}>{renderStars(review.rating)}</View>

              <Text style={styles.reviewBody} numberOfLines={6}>
                {truncateBody(review.body)}
              </Text>

              <View style={styles.likesRow}>
                <Ionicons name="heart" size={14} color="#ff8b8b" />
                <Text style={styles.likesText}>{review.likes}</Text>
              </View>

              {review.cover_url ? (
                <Image
                  source={{ uri: review.cover_url }}
                  style={styles.coverImage}
                />
              ) : (
                <View style={styles.coverFallback}>
                  <Text style={styles.coverFallbackText}>No cover</Text>
                </View>
              )}

              <Text style={styles.reviewMeta}>
                Created {new Date(review.updated_at).toLocaleString()}
              </Text>
            </View>
          ))
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16181c",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  heading: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  subheading: {
    color: "#a9b0bf",
    fontSize: 14,
    lineHeight: 20,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    color: "#c0c7d8",
  },
  errorText: {
    color: "#ff8b8b",
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2f3542",
    backgroundColor: "#242832",
    padding: 18,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyText: {
    color: "#a9b3c8",
    textAlign: "center",
    lineHeight: 20,
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2f3542",
    backgroundColor: "#242832",
    padding: 14,
    gap: 10,
  },
  reviewTopRow: {
    flexDirection: "row",
    gap: 12,
  },
  reviewerIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#2f3542",
    backgroundColor: "#1a1d24",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  usernameText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  reviewTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginRight: 2,
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likesText: {
    color: "#ffb7b7",
    fontSize: 12,
    fontWeight: "700",
  },
  reviewMeta: {
    color: "#9ba6bf",
    fontSize: 12,
    lineHeight: 18,
  },
  reviewBody: {
    color: "#e4e9f3",
    fontSize: 14,
    lineHeight: 21,
  },
  coverImage: {
    width: 90,
    height: 130,
    borderRadius: 10,
    backgroundColor: "#1a1d24",
    position: "absolute",
    right: 30,
    top: 50,
  },
  coverFallback: {
    width: 76,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#1a1d24",
    alignItems: "center",
    justifyContent: "center",
  },
  coverFallbackText: {
    color: "#8f99ad",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
