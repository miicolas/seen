import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import type { ShareRecap } from "@/services/analytics";

import { ShareCardFrame, shareCardTextColors } from "./share-card-frame";

export function TasteCard({ recap, accent }: { recap: ShareRecap; accent: string }) {
  const genres = (recap.top_genres ?? []).map((genre) => genre.genre).slice(0, 3);
  const movies = recap.media_type_mix?.movie ?? 0;
  const tv = recap.media_type_mix?.tv ?? 0;
  const total = movies + tv;
  const moviePct = total > 0 ? Math.round((movies / total) * 100) : 0;

  return (
    <ShareCardFrame eyebrow="My taste" accent={accent}>
      <Text style={[styles.label, { color: shareCardTextColors.muted }]}>Current era</Text>
      <Text style={[styles.hero, { color: shareCardTextColors.text }]}>
        {recap.current_era?.label ?? "—"}
      </Text>
      {genres.length > 0 ? (
        <View style={styles.chips}>
          {genres.map((genre) => (
            <Text key={genre} style={[styles.chip, { color: shareCardTextColors.text, borderColor: accent }]}>
              {genre}
            </Text>
          ))}
        </View>
      ) : null}
      <Text style={[styles.line, { color: shareCardTextColors.muted }]}>
        {moviePct}% movies · {100 - moviePct}% series · {recap.total_logged ?? 0} logged
      </Text>
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hero: {
    fontSize: FONT_SIZE.HEADING_LG,
    fontWeight: "800",
  },
  line: {
    fontSize: FONT_SIZE.MD,
    fontWeight: "500",
    marginTop: SPACING.SM,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.XS,
    marginTop: SPACING.XS,
  },
  chip: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
    borderWidth: 1,
    borderRadius: 999,
    borderCurve: "continuous",
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    overflow: "hidden",
  },
});
