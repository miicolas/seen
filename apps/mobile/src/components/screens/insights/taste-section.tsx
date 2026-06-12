import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { BarChart, type BarDatum } from "@/components/insights/bar-chart";
import { DotMatrix } from "@/components/insights/charts/dot-matrix";
import { useSeriesColors } from "@/components/insights/charts/series-colors";
import { InsightCard } from "@/components/insights/insight-card";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import type { Taste } from "@/services/analytics";

export function TasteSection({ taste }: { taste: Taste }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const colors = useSeriesColors();

  if (taste.total_logged === 0) return null;

  const matrixGenres = taste.genre_mix.slice(0, 3);

  // Distribution: 10 stored-rating buckets → label only the whole stars.
  const distribution: BarDatum[] = taste.rating_distribution.map((count, index) => ({
    key: String(index),
    label: (index + 1) % 2 === 0 ? `${(index + 1) / 2}★` : "",
    exact: count,
    estimated: 0,
  }));
  const hasRatings = taste.total_rated > 0;

  return (
    <InsightCard title={t("insights.tasteTitle")}>
      {taste.current_era.decade != null ? (
        <Text style={[styles.era, { color: theme.text }]}>
          {t("insights.eraStatement")}{" "}
          <Text style={{ color: accentHex }}>{taste.current_era.label}</Text>
        </Text>
      ) : null}

      {matrixGenres.length > 0 ? (
        <View style={styles.matrices}>
          {matrixGenres.map((genre, index) => (
            <View key={genre.genre} style={styles.matrix}>
              <DotMatrix
                percent={genre.share}
                color={colors[index % colors.length]}
                inactiveColor={theme.backgroundSelected}
              />
              <Text style={[styles.matrixPercent, { color: theme.text }]}>
                {Math.round(genre.share * 100)}%
              </Text>
              <Text
                style={[styles.matrixLabel, { color: colors[index % colors.length] }]}
                numberOfLines={1}>
                {genre.genre}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {hasRatings ? (
        <View style={styles.subsection}>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
            {t("insights.ratingDistribution")}
          </Text>
          <BarChart
            bars={distribution}
            accent={accentHex}
            height={88}
            describeValue={(count) => t("insights.ratingsCount", { count })}
          />
        </View>
      ) : null}

      {taste.highest_rated_genres.length > 0 ? (
        <View style={styles.subsection}>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
            {t("insights.lovedGenres")}
          </Text>
          {taste.highest_rated_genres.slice(0, 3).map((genre) => (
            <View key={genre.genre} style={styles.lovedRow}>
              <Text style={[styles.lovedGenre, { color: theme.text }]}>{genre.genre}</Text>
              <Text style={[styles.lovedRating, { color: theme.textSecondary }]}>
                {genre.avg_rating}★
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {taste.contradictions.map((contradiction) => (
        <Text key={contradiction.id} style={[styles.contradiction, { color: theme.textSecondary }]}>
          {contradiction.label}
        </Text>
      ))}
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  era: {
    fontSize: FONT_SIZE.XL,
    fontWeight: "700",
  },
  matrices: {
    flexDirection: "row",
    gap: SPACING.MD,
    marginTop: SPACING.XS,
  },
  matrix: {
    flex: 1,
    gap: SPACING.XS,
  },
  matrixPercent: {
    fontSize: FONT_SIZE.XL,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  matrixLabel: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "700",
  },
  subsection: {
    gap: SPACING.XS,
    marginTop: SPACING.XS,
  },
  subTitle: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
  lovedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lovedGenre: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "500",
  },
  lovedRating: {
    fontSize: FONT_SIZE.SM,
    fontVariant: ["tabular-nums"],
  },
  contradiction: {
    fontSize: FONT_SIZE.SM,
    fontStyle: "italic",
    marginTop: 2,
  },
});
