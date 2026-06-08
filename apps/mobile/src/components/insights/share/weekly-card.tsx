import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { formatWatchMinutes } from "@/lib/format";
import type { ShareRecap } from "@/services/analytics";

import { ShareCardFrame, shareCardTextColors } from "./share-card-frame";

export function WeeklyCard({ recap, accent }: { recap: ShareRecap; accent: string }) {
  const genres = (recap.top_genres ?? []).map((genre) => genre.genre).slice(0, 3);

  return (
    <ShareCardFrame eyebrow="This week" accent={accent}>
      <Text style={[styles.label, { color: shareCardTextColors.muted }]}>Watched time</Text>
      <Text style={[styles.hero, { color: shareCardTextColors.text }]}>
        {formatWatchMinutes(recap.total_minutes ?? 0)}
      </Text>
      <Text style={[styles.line, { color: shareCardTextColors.muted }]}>
        {recap.media_count ?? 0} titles · {recap.episode_count ?? 0} episodes
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
    fontSize: FONT_SIZE.HEADING_XL,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  line: {
    fontSize: FONT_SIZE.MD,
    fontWeight: "500",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.XS,
    marginTop: SPACING.SM,
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
