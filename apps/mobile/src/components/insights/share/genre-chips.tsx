import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";

import { shareCardColors } from "./share-card-frame";

// Filled accent-tinted genre capsules shared by the weekly and taste cards.
export function GenreChips({ genres, accent }: { genres: string[]; accent: string }) {
  if (genres.length === 0) return null;

  return (
    <View style={styles.row}>
      {genres.map((genre) => (
        <View key={genre} style={[styles.chip, { backgroundColor: `${accent}30` }]}>
          <Text style={styles.label}>{genre}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.XS + 2,
    marginTop: SPACING.SM,
  },
  chip: {
    borderRadius: 999,
    borderCurve: "continuous",
    paddingHorizontal: SPACING.SM + SPACING.XS,
    paddingVertical: 5,
  },
  label: {
    color: shareCardColors.text,
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
});
