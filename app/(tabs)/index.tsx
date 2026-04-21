import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { searchTwitchGames } from "../../lib/twitchProxy";

type Section = {
  title: string;
  query: string;
};

type GameCard = {
  id?: number | string;
  name?: string;
  coverUrl?: string;
};

type LoadedSection = {
  title: string;
  items: GameCard[];
};

type UserStats = {
  played: number;
  playing: number;
  reviewed: number;
  backlog: number;
};

const USER_STATS: UserStats = {
  played: 128,
  playing: 6,
  reviewed: 52,
  backlog: 73,
};

const SECTIONS: Section[] = [
  {
    title: "Recently Trending",
    query: "feed:trending",
  },
];

export default function Index() {
  const [sections, setSections] = useState<LoadedSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSections() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const loaded = await Promise.all(
          SECTIONS.map(async (section) => {
            const items = await searchTwitchGames(section.query);
            return {
              title: section.title,
              items: items.slice(0, 10),
            };
          }),
        );

        setSections(loaded);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load home sections";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSections();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.heroTitle}>Hello [player]</Text>

      <View style={styles.statsCard}>
        <Text style={styles.statsHeading}>Your Snapshot</Text>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{USER_STATS.played}</Text>
            <Text style={styles.statLabel}>Played</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{USER_STATS.playing}</Text>
            <Text style={styles.statLabel}>Playing</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{USER_STATS.reviewed}</Text>
            <Text style={styles.statLabel}>Reviewed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{USER_STATS.backlog}</Text>
            <Text style={styles.statLabel}>Backlog</Text>
          </View>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#80a3ff" />
          <Text style={styles.loadingText}>Loading sections...</Text>
        </View>
      )}

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {!isLoading &&
        sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {section.items.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No games found yet</Text>
                </View>
              ) : (
                section.items.map((item) => (
                  <View
                    key={`${section.title}-${item.id ?? item.name}`}
                    style={styles.card}
                  >
                    <View style={styles.poster}>
                      {item.coverUrl ? (
                        <Image
                          source={{ uri: item.coverUrl }}
                          style={styles.posterImage}
                        />
                      ) : (
                        <Text style={styles.posterLabel}>No image</Text>
                      )}
                    </View>
                    <Text numberOfLines={2} style={styles.cardTitle}>
                      {item.name ?? "Untitled"}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
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
    paddingVertical: 14,
    paddingBottom: 26,
  },
  heroTitle: {
    color: "#d5def0",
    fontSize: 30,
    fontWeight: "900",
    marginHorizontal: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#1d2230",
    borderWidth: 1,
    borderColor: "#2d3345",
  },
  statsHeading: {
    color: "#f4f6f8",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    width: "48%",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#252c3c",
    borderWidth: 1,
    borderColor: "#2f374c",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: "#9ba6bf",
    fontSize: 12,
    marginTop: 3,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  loadingText: {
    color: "#c0c7d8",
  },
  errorText: {
    color: "#ff8b8b",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: "#f4f6f8",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  card: {
    width: 126,
    marginLeft: 16,
  },
  emptyCard: {
    width: 190,
    marginLeft: 16,
    height: 184,
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
    fontSize: 13,
    textAlign: "center",
  },
  poster: {
    height: 184,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#242832",
    borderWidth: 1,
    borderColor: "#2f3542",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  posterLabel: {
    color: "#8f99ad",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    paddingRight: 6,
  },
});
