import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../lib/auth";
import { createReview, type ReviewInput } from "../../lib/reviews";
import { searchTwitchGames, type TwitchGame } from "../../lib/twitchProxy";

const EMPTY_FORM: ReviewInput = {
  rating: 0,
  gameId: "",
  gameName: "",
  coverUrl: "",
  body: "",
};

export default function CreateScreen() {
  const { session } = useAuth();
  const [form, setForm] = useState<ReviewInput>(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TwitchGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function updateField<K extends keyof ReviewInput>(
    key: K,
    value: ReviewInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setQuery("");
    setResults([]);
  }

  function validateForm() {
    if (!form.gameId.trim()) {
      return "Select a game before creating a review.";
    }

    if (!form.body.trim()) {
      return "Review text is required.";
    }

    if (form.rating < 1 || form.rating > 5) {
      return "Rating must be between 1 and 5 stars.";
    }

    return null;
  }

  async function handleSearch() {
    setSearching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await searchTwitchGames(query);
      setResults(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to search games.");
    } finally {
      setSearching(false);
    }
  }

  function selectGame(game: TwitchGame) {
    setForm((current) => ({
      ...current,
      gameId: String(game.id ?? ""),
      gameName: game.name ?? "Untitled",
      coverUrl: game.coverUrl ?? "",
    }));
    setQuery(game.name ?? "");
    setResults([]);
  }

  async function onSubmit() {
    const userId = session?.user?.id;
    if (!userId) {
      setError("You must be signed in to manage reviews.");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await createReview(userId, form);
      setSuccessMessage(`Created review for ${form.gameName}.`);
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save review.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderStarPicker() {
    return (
      <View style={styles.starRow}>
        {Array.from({ length: 5 }, (_, index) => {
          const starNumber = index + 1;
          const filled = starNumber <= form.rating;

          return (
            <Pressable
              key={`star-${starNumber}`}
              onPress={() => updateField("rating", starNumber)}
              style={({ pressed }) => [
                styles.starButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name={filled ? "star" : "star-outline"}
                size={30}
                color={filled ? "#f5c84c" : "#76829c"}
              />
            </Pressable>
          );
        })}
        <Text style={styles.starValue}>
          {form.rating > 0 ? `${form.rating}/5` : "Pick a rating"}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.heading}>Create review</Text>
          <Text style={styles.subheading}>
            Search for a game, pick a star rating, and write your review.
          </Text>

          <Text style={styles.label}>Search game</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search games..."
            placeholderTextColor="#77829c"
            style={styles.input}
          />

          <Pressable
            onPress={handleSearch}
            disabled={!query.trim() || searching}
            style={({ pressed }) => [
              styles.searchButton,
              (!query.trim() || searching || pressed) && styles.buttonPressed,
            ]}
          >
            <Text style={styles.searchButtonText}>
              {searching ? "Searching..." : "Find game"}
            </Text>
          </Pressable>

          {searching ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#80a3ff" />
              <Text style={styles.statusText}>Searching games...</Text>
            </View>
          ) : null}

          {form.gameName ? (
            <View style={styles.selectedGameCard}>
              {form.coverUrl ? (
                <Image
                  source={{ uri: form.coverUrl }}
                  style={styles.selectedGameImage}
                />
              ) : (
                <View style={styles.selectedGameFallback}>
                  <Text style={styles.coverFallbackText}>No cover</Text>
                </View>
              )}

              <View style={styles.selectedGameText}>
                <Text style={styles.selectedGameLabel}>Selected game</Text>
                <Text style={styles.selectedGameTitle}>{form.gameName}</Text>
              </View>
            </View>
          ) : null}

          {results.length > 0 ? (
            <View style={styles.searchResults}>
              {results.slice(0, 5).map((game) => (
                <Pressable
                  key={String(game.id ?? game.name)}
                  onPress={() => selectGame(game)}
                  style={({ pressed }) => [
                    styles.resultCard,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {game.coverUrl ? (
                    <Image
                      source={{ uri: game.coverUrl }}
                      style={styles.resultImage}
                    />
                  ) : (
                    <View style={styles.resultFallback}>
                      <Text style={styles.coverFallbackText}>No cover</Text>
                    </View>
                  )}

                  <View style={styles.resultTextColumn}>
                    <Text style={styles.resultTitle}>
                      {game.name ?? "Untitled"}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {(game.releaseDate ?? "").slice(0, 4) || "Unknown year"}
                    </Text>
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {game.genreName ?? "Unknown genre"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Rating</Text>
          {renderStarPicker()}

          <Text style={styles.label}>Review</Text>
          <TextInput
            value={form.body}
            onChangeText={(value) => updateField("body", value)}
            placeholder="Write your thoughts here..."
            placeholderTextColor="#77829c"
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textarea]}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          <View style={styles.formActions}>
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || submitting) && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Saving..." : "Create review"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: 16,
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2f3542",
    backgroundColor: "#242832",
    padding: 16,
  },
  heading: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  subheading: {
    color: "#b4bfd6",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  label: {
    color: "#d5def0",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#394152",
    borderRadius: 10,
    backgroundColor: "#1a1d24",
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  searchButton: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4a669e",
    backgroundColor: "#25344d",
    paddingVertical: 12,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#d9e6ff",
    fontSize: 14,
    fontWeight: "700",
  },
  statusRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: "#c0c7d8",
  },
  selectedGameCard: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#394152",
    backgroundColor: "#1a1d24",
    padding: 12,
  },
  selectedGameImage: {
    width: 64,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#242832",
  },
  selectedGameFallback: {
    width: 64,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#242832",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedGameText: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  selectedGameLabel: {
    color: "#9ba6bf",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedGameTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  searchResults: {
    marginTop: 12,
    gap: 10,
  },
  resultCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#394152",
    backgroundColor: "#1a1d24",
    padding: 10,
  },
  resultImage: {
    width: 52,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#242832",
  },
  resultFallback: {
    width: 52,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#242832",
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  resultTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  resultMeta: {
    color: "#9ba6bf",
    fontSize: 12,
    lineHeight: 18,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  starButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  starValue: {
    marginLeft: 8,
    color: "#d5def0",
    fontSize: 13,
    fontWeight: "700",
  },
  textarea: {
    minHeight: 120,
    paddingTop: 12,
  },
  errorText: {
    color: "#ff8b8b",
    marginTop: 12,
  },
  successText: {
    color: "#9ae6b4",
    marginTop: 12,
  },
  formActions: {
    marginTop: 16,
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: "#80a3ff",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#101723",
    fontSize: 14,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  coverFallbackText: {
    color: "#8f99ad",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
