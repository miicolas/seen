import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { InsightsDonut } from "@/lib/native-charts";
import type { ShareRecap } from "@/services/analytics";

import { GenreChips } from "./genre-chips";
import {
  ShareCardFrame,
  shareCardColors,
  type ShareCardFormat,
  shareCardTypography,
} from "./share-card-frame";

export function TasteCard({
  recap,
  accent,
  format,
}: {
  recap: ShareRecap;
  accent: string;
  format: ShareCardFormat;
}) {
  const genres = (recap.top_genres ?? []).map((genre) => genre.genre).slice(0, 3);
  const movies = recap.media_type_mix?.movie ?? 0;
  const tv = recap.media_type_mix?.tv ?? 0;
  const total = movies + tv;
  const moviePct = total > 0 ? Math.round((movies / total) * 100) : 0;
  const donutSize = format === "story" ? 120 : 84;

  return (
    <ShareCardFrame eyebrow="My taste" accent={accent} format={format}>
      <Text style={shareCardTypography.label}>Current era</Text>
      <Text style={[shareCardTypography.hero, styles.hero]}>{recap.current_era?.label ?? "—"}</Text>
      {total > 0 ? (
        <View style={styles.donutRow}>
          <InsightsDonut
            segments={[
              { label: "Movies", value: movies, color: accent },
              { label: "Series", value: tv, color: `${accent}66` },
            ]}
            animate={false}
            style={{ width: donutSize, height: donutSize }}
          />
          <View style={styles.donutLegend}>
            <Text style={[styles.legendLine, { color: shareCardColors.text }]}>
              <Text style={{ color: accent }}>●</Text> {moviePct}% movies
            </Text>
            <Text style={[styles.legendLine, { color: shareCardColors.text }]}>
              <Text style={{ color: `${accent}66` }}>●</Text> {100 - moviePct}% series
            </Text>
            <Text style={[styles.legendLine, { color: shareCardColors.muted }]}>
              {recap.total_logged ?? 0} logged
            </Text>
          </View>
        </View>
      ) : null}
      <GenreChips genres={genres} accent={accent} />
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontSize: FONT_SIZE.HEADING_LG,
    letterSpacing: -1,
  },
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    marginVertical: SPACING.XS,
  },
  donutLegend: {
    gap: 4,
  },
  legendLine: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
});
