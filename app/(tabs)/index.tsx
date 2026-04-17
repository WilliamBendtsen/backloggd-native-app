import { ScrollView, StyleSheet, Text, View } from "react-native";

type Section = {
  title: string;
  items: string[];
};

const SECTIONS: Section[] = [
  {
    title: "Recently Trending",
    items: [
      "Dune: Part Two",
      "Challengers",
      "Civil War",
      "The Fall Guy",
      "Love Lies Bleeding",
      "Poor Things",
    ],
  },
  {
    title: "Coming Soon",
    items: [
      "Mickey 17",
      "Nosferatu",
      "Furiosa",
      "Gladiator II",
      "Wicked",
      "Joker: Folie a Deux",
    ],
  },
  {
    title: "Recently Anticipated",
    items: [
      "The Brutalist",
      "Anora",
      "The Substance",
      "The Zone of Interest",
      "Kinds of Kindness",
      "May December",
    ],
  },
  {
    title: "Sleeper Hits",
    items: [
      "Bottoms",
      "Past Lives",
      "Perfect Days",
      "Rye Lane",
      "How to Blow Up a Pipeline",
      "Hundreds of Beavers",
    ],
  },
];

export default function Index() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {section.items.map((item) => (
              <View key={`${section.title}-${item}`} style={styles.card}>
                <View style={styles.poster}>
                  <Text style={styles.posterLabel}>Poster</Text>
                </View>
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {item}
                </Text>
              </View>
            ))}
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
    paddingVertical: 18,
    paddingBottom: 26,
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
  poster: {
    height: 184,
    borderRadius: 10,
    backgroundColor: "#242832",
    borderWidth: 1,
    borderColor: "#2f3542",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
