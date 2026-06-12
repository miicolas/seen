import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { BreakdownBarWithLegend } from "@/components/insights/charts/breakdown-bar-with-legend";
import { useSeriesColors } from "@/components/insights/charts/series-colors";
import { InsightCard } from "@/components/insights/insight-card";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import type { Taste } from "@/services/analytics";

const TOP_GENRES = 5;

const formatShare = (value: number, total: number) => `${Math.round((value / total) * 100)}%`;

export function BreakdownSection({ taste }: { taste: Taste }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = useSeriesColors();

  if (taste.total_logged === 0) return null;

  const movie = taste.media_type_mix.movie;
  const tv = taste.media_type_mix.tv;

  const topGenres = taste.genre_mix.slice(0, TOP_GENRES);
  const otherCount = taste.genre_mix
    .slice(TOP_GENRES)
    .reduce((sum, genre) => sum + genre.count, 0);
  const genreSegments = [
    ...topGenres.map((genre, index) => ({
      label: genre.genre,
      value: genre.count,
      color: colors[index % colors.length],
    })),
    ...(otherCount > 0
      ? [{ label: t("insights.other"), value: otherCount, color: theme.backgroundSelected }]
      : []),
  ];

  return (
    <InsightCard title={t("insights.breakdownTitle")}>
      {movie + tv > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
            {t("insights.mediaMix")}
          </Text>
          <BreakdownBarWithLegend
            segments={[
              { label: t("insights.movies"), value: movie, color: colors[0] },
              { label: t("insights.series"), value: tv, color: colors[1] },
            ]}
            formatValue={formatShare}
          />
        </View>
      ) : null}

      {genreSegments.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
            {t("insights.genreMix")}
          </Text>
          <BreakdownBarWithLegend segments={genreSegments} formatValue={formatShare} />
        </View>
      ) : null}
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: SPACING.XS,
  },
  subTitle: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
});
