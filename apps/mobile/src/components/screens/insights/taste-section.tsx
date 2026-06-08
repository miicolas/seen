import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { BarChart, type BarDatum } from "@/components/insights/bar-chart";
import { InsightCard } from "@/components/insights/insight-card";
import { LabeledBar } from "@/components/insights/labeled-bar";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import type { Taste } from "@/services/analytics";

export function TasteSection({ taste }: { taste: Taste }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  if (taste.total_logged === 0) return null;

  const genres = taste.genre_mix.slice(0, 6);
  const maxGenre = Math.max(1, ...genres.map((g) => g.count));

  // Distribution: 10 stored-rating buckets → label only the whole stars.
  const distribution: BarDatum[] = taste.rating_distribution.map((count, index) => ({
    key: String(index),
    label: (index + 1) % 2 === 0 ? `${(index + 1) / 2}★` : "",
    exact: count,
    estimated: 0,
  }));
  const hasRatings = taste.total_rated > 0;

  const moviePct =
    taste.media_type_mix.movie + taste.media_type_mix.tv > 0
      ? Math.round(
          (taste.media_type_mix.movie /
            (taste.media_type_mix.movie + taste.media_type_mix.tv)) *
            100,
        )
      : 0;

  return (
    <InsightCard title={t("insights.tasteTitle")}>
      <View style={styles.group}>
        {genres.map((genre) => (
          <LabeledBar
            key={genre.genre}
            label={genre.genre}
            value={genre.count}
            max={maxGenre}
            trailing={`${Math.round(genre.share * 100)}%`}
            color={accentHex}
          />
        ))}
      </View>

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

      <Text style={[styles.meta, { color: theme.textSecondary }]}>
        {t("insights.mediaSplit", { movies: moviePct, series: 100 - moviePct })}
      </Text>
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: SPACING.SM,
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
  meta: {
    fontSize: FONT_SIZE.XS,
    marginTop: 2,
  },
});
