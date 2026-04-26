import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../lib/auth";
import { getAvatarPublicUrl } from "../../lib/profiles";
import {
  deleteReview,
  listAllReviews,
  listProfilesByIds,
  updateReview,
  type ReviewRow,
} from "../../lib/reviews";

export default function ReviewsScreen() {
  const { session, backloggdUsername } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [authorNamesById, setAuthorNamesById] = useState<
    Record<string, string>
  >({});
  const [authorAvatarsById, setAuthorAvatarsById] = useState<
    Record<string, string | null>
  >({});
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editRating, setEditRating] = useState(1);
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const nextAuthorAvatarsById = Object.fromEntries(
          profiles.map((profile) => [
            profile.id,
            getAvatarPublicUrl(profile.avatar_path),
          ]),
        );

        setReviews(nextReviews);
        setAuthorNamesById(nextAuthorNamesById);
        setAuthorAvatarsById(nextAuthorAvatarsById);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [session?.user?.id]);

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

  function beginEdit(review: ReviewRow) {
    setError(null);
    setEditingReviewId(review.id);
    setEditBody(review.body);
    setEditRating(Math.max(1, Math.min(5, Math.round(review.rating))));
  }

  function cancelEdit() {
    setEditingReviewId(null);
    setEditBody("");
    setEditRating(1);
  }

  async function saveEdit(review: ReviewRow) {
    const trimmedBody = editBody.trim();

    if (!trimmedBody) {
      setError("Review body cannot be empty.");
      return;
    }

    setSavingReviewId(review.id);
    setError(null);

    try {
      const updated = await updateReview(review.id, {
        rating: editRating,
        gameId: review.game_id,
        gameName: review.game_name,
        coverUrl: review.cover_url ?? "",
        body: trimmedBody,
      });

      setReviews((previous) =>
        previous.map((item) => (item.id === review.id ? updated : item)),
      );
      cancelEdit();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update review.");
    } finally {
      setSavingReviewId(null);
    }
  }

  function confirmDelete(review: ReviewRow) {
    Alert.alert(
      "Delete review",
      "This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingReviewId(review.id);
            setError(null);

            try {
              await deleteReview(review.id);
              setReviews((previous) =>
                previous.filter((item) => item.id !== review.id),
              );

              if (editingReviewId === review.id) {
                cancelEdit();
              }
            } catch (e: any) {
              setError(e?.message ?? "Failed to delete review.");
            } finally {
              setDeletingReviewId(null);
            }
          },
        },
      ],
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
                    {authorAvatarsById[review.user_id] ? (
                      <Image
                        source={{
                          uri: authorAvatarsById[review.user_id] as string,
                        }}
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

                {review.user_id === session?.user?.id ? (
                  <View style={styles.ownerActions}>
                    <Pressable
                      onPress={() => beginEdit(review)}
                      accessibilityRole="button"
                      accessibilityLabel="Edit review"
                      disabled={deletingReviewId === review.id}
                      style={({ pressed }) => [
                        styles.iconActionButton,
                        pressed && styles.iconActionButtonPressed,
                      ]}
                    >
                      <Ionicons name="pencil" size={14} color="#d7deef" />
                    </Pressable>

                    <Pressable
                      onPress={() => confirmDelete(review)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete review"
                      disabled={deletingReviewId === review.id}
                      style={({ pressed }) => [
                        styles.iconActionButton,
                        pressed && styles.iconActionButtonPressed,
                      ]}
                    >
                      {deletingReviewId === review.id ? (
                        <ActivityIndicator size="small" color="#ff8b8b" />
                      ) : (
                        <Ionicons name="trash" size={14} color="#ff8b8b" />
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={styles.reviewContentRow}>
                <View style={styles.reviewMainColumn}>
                  <Text style={styles.reviewTitle}>{review.game_name}</Text>

                  <View style={styles.ratingRow}>{renderStars(review.rating)}</View>

                  {editingReviewId === review.id ? (
                    <View style={styles.editorWrap}>
                      <View style={styles.editorRatingRow}>
                        <Text style={styles.editorLabel}>Rating</Text>
                        <View style={styles.editorRatingControls}>
                          <Pressable
                            onPress={() =>
                              setEditRating((value) => Math.max(1, value - 1))
                            }
                            style={({ pressed }) => [
                              styles.ratingAdjustButton,
                              pressed && styles.iconActionButtonPressed,
                            ]}
                          >
                            <Ionicons name="remove" size={14} color="#d7deef" />
                          </Pressable>
                          <View style={styles.ratingPreviewRow}>
                            {renderStars(editRating)}
                          </View>
                          <Pressable
                            onPress={() =>
                              setEditRating((value) => Math.min(5, value + 1))
                            }
                            style={({ pressed }) => [
                              styles.ratingAdjustButton,
                              pressed && styles.iconActionButtonPressed,
                            ]}
                          >
                            <Ionicons name="add" size={14} color="#d7deef" />
                          </Pressable>
                        </View>
                      </View>

                      <TextInput
                        value={editBody}
                        onChangeText={setEditBody}
                        multiline
                        textAlignVertical="top"
                        style={styles.editorBodyInput}
                        placeholder="Update your review"
                        placeholderTextColor="#7f8897"
                        editable={savingReviewId !== review.id}
                        maxLength={1000}
                      />

                      <View style={styles.editorActions}>
                        <Pressable
                          onPress={cancelEdit}
                          disabled={savingReviewId === review.id}
                          style={({ pressed }) => [
                            styles.editorActionButton,
                            styles.editorCancelButton,
                            pressed &&
                              savingReviewId !== review.id &&
                              styles.iconActionButtonPressed,
                          ]}
                        >
                          <Text style={styles.editorCancelText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => saveEdit(review)}
                          disabled={savingReviewId === review.id}
                          style={({ pressed }) => [
                            styles.editorActionButton,
                            styles.editorSaveButton,
                            (pressed || savingReviewId === review.id) &&
                              styles.iconActionButtonPressed,
                          ]}
                        >
                          {savingReviewId === review.id ? (
                            <ActivityIndicator size="small" color="#0b0e12" />
                          ) : (
                            <Text style={styles.editorSaveText}>Save changes</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Text
                      style={styles.reviewBody}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {review.body}
                    </Text>
                  )}

                  <View style={styles.likesRow}>
                    <Ionicons name="heart" size={14} color="#ff8b8b" />
                    <Text style={styles.likesText}>{review.likes}</Text>
                  </View>
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
              </View>

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
  reviewContentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  reviewMainColumn: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  reviewerIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  ownerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#343c4d",
    backgroundColor: "#1d222c",
    alignItems: "center",
    justifyContent: "center",
  },
  iconActionButtonPressed: {
    opacity: 0.8,
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
    minHeight: 84,
  },
  editorWrap: {
    gap: 10,
  },
  editorRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  editorLabel: {
    color: "#cdd5e7",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  editorRatingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingAdjustButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#343c4d",
    backgroundColor: "#1d222c",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editorBodyInput: {
    minHeight: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#343c4d",
    backgroundColor: "#1d222c",
    color: "#e4e9f3",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editorActionButton: {
    minWidth: 90,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  editorCancelButton: {
    borderWidth: 1,
    borderColor: "#343c4d",
    backgroundColor: "transparent",
  },
  editorSaveButton: {
    backgroundColor: "#ffffff",
  },
  editorCancelText: {
    color: "#d7deef",
    fontSize: 13,
    fontWeight: "700",
  },
  editorSaveText: {
    color: "#0b0e12",
    fontSize: 13,
    fontWeight: "800",
  },
  coverImage: {
    width: 90,
    height: 130,
    borderRadius: 10,
    backgroundColor: "#1a1d24",
    marginTop: 2,
  },
  coverFallback: {
    width: 90,
    height: 130,
    borderRadius: 10,
    backgroundColor: "#1a1d24",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  coverFallbackText: {
    color: "#8f99ad",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
