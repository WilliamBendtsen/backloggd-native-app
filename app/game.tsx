import { useLocalSearchParams } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

function pickParam(
  value: string | string[] | undefined,
  fallback: string,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export default function GameDetailScreen() {
  const params = useLocalSearchParams();

  const name = pickParam(params.name, "Untitled");
  const coverUrl = pickParam(params.coverUrl, "");
  const releaseDate = pickParam(params.releaseDate, "Unknown release date");
  const genreName = pickParam(params.genreName, "Unknown genre");
  const developerName = pickParam(params.developerName, "Unknown developer");
  const publisherName = pickParam(params.publisherName, "Unknown publisher");
  const platformName = pickParam(params.platformName, "Unknown platform");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.coverWrap}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          ) : (
            <Text style={styles.noImageText}>No image</Text>
          )}
        </View>

        <Text style={styles.title}>{name}</Text>
        <Text style={styles.releaseYear}>
          {(releaseDate ?? "").slice(0, 4) || "Unknown year"}
        </Text>
        <Text style={styles.genreTag}>{genreName}</Text>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Publisher</Text>
          <Text style={styles.metaValue}>{publisherName}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Developer</Text>
          <Text style={styles.metaValue}>{developerName}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Platforms</Text>
          <Text style={styles.metaValue}>{platformName}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Release date</Text>
          <Text style={styles.metaValue}>{releaseDate}</Text>
        </View>
      </View>
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
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: "#2d3340",
    borderRadius: 12,
    backgroundColor: "#1e222b",
    padding: 14,
    gap: 10,
  },
  coverWrap: {
    alignSelf: "center",
    width: 180,
    height: 240,
    borderRadius: 10,
    backgroundColor: "#2d3340",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  noImageText: {
    color: "#8f99ad",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },
  releaseYear: {
    color: "#c7cedb",
    fontSize: 13,
  },
  genreTag: {
    alignSelf: "flex-start",
    color: "#d9e6ff",
    backgroundColor: "#25344d",
    borderColor: "#36527f",
    borderWidth: 1,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  metaGroup: {
    marginTop: 6,
    gap: 2,
  },
  metaLabel: {
    color: "#9ba6bf",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    color: "#e3e8f2",
    fontSize: 15,
    lineHeight: 21,
  },
});
