import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { searchTwitchGames } from "../../lib/twitchProxy";

type TwitchGame = {
  id?: number | string;
  name?: string;
  coverUrl?: string;
  genreName?: string;
  releaseDate?: string;
  publisherName?: string;
  developerName?: string;
  platformName?: string;
};

function truncateText(value?: string, maxLength = 30, fallback = "Unknown") {
  if (!value || !value.trim()) {
    return fallback;
  }

  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}...`;
}

function firstListItem(value?: string) {
  if (!value) {
    return undefined;
  }

  const first = value
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);

  return first || undefined;
}

export default function Index() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TwitchGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSearch() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await searchTwitchGames(query);
      setResults(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected proxy error";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search games..."
        placeholderTextColor="#7a8191"
        style={styles.input}
        submitBehavior="blurAndSubmit"
        onSubmitEditing={handleSearch}
      />

      {isLoading && (
        <View style={styles.statusRow}>
          <ActivityIndicator color="#80a3ff" />
          <Text style={styles.statusText}>Loading...</Text>
        </View>
      )}

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {results.map((game) => (
        <View key={String(game.id ?? game.name)} style={styles.resultCard}>
          <Image style={styles.coverImage} source={{ uri: game.coverUrl }} />

          <View style={styles.resultTextColumn}>
            <View>
              <Text style={styles.resultTitle}>{game.name ?? "Untitled"}</Text>
              <Text style={styles.releaseYear}>
                {(game.releaseDate ?? "").slice(0, 4) || "Unknown year"}
              </Text>
              <Text style={styles.genreTag} numberOfLines={1}>
                {truncateText(game.genreName, 40, "Unknown genre")}
              </Text>
            </View>

            <View style={styles.resultInfoGroup}>
              <Text style={styles.resultMeta} numberOfLines={1}>
                Publisher:{" "}
                {truncateText(
                  firstListItem(game.publisherName),
                  28,
                  "Unknown publisher",
                )}
              </Text>
              <Text style={styles.resultMeta} numberOfLines={1}>
                Developer:{" "}
                {truncateText(
                  firstListItem(game.developerName),
                  28,
                  "Unknown developer",
                )}
              </Text>
            </View>

            <Text style={styles.platformText}>
              {game.platformName ?? "Unknown platform"}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#16181c",
  },
  container: {
    padding: 16,
    paddingBottom: 26,
  },
  heading: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  subheading: {
    color: "#a9b0bf",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2d3340",
    backgroundColor: "#1e222b",
    borderRadius: 10,
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: "#fff",
  },
  errorText: {
    marginTop: 14,
    color: "#ff8b8b",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2d3340",
    borderRadius: 10,
    backgroundColor: "#1e222b",
  },
  resultTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    flexShrink: 1,
  },
  releaseYear: {
    color: "#c7cedb",
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 6,
  },
  genreTag: {
    alignSelf: "flex-start",
    color: "#d9e6ff",
    backgroundColor: "#25344d",
    borderColor: "#36527f",
    borderWidth: 1,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  resultTextColumn: {
    flex: 1,
    minHeight: 160,
    justifyContent: "space-between",
  },
  resultInfoGroup: {
    gap: 4,
  },
  resultMeta: {
    color: "#a9b0bf",
    fontSize: 13,
    lineHeight: 18,
  },
  platformText: {
    color: "#dfe5f3",
    fontSize: 12,
    lineHeight: 16,
  },
  coverImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: "#2d3340",
  },
});
