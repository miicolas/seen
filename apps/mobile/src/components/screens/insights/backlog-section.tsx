import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { RingStat } from "@/components/insights/charts/ring-stat";
import { InsightCard } from "@/components/insights/insight-card";
import { StatTile } from "@/components/insights/stat-tile";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTheme } from "@/hooks/use-theme";
import type { WatchlistBacklog } from "@/services/analytics";

export function BacklogSection({ backlog }: { backlog: WatchlistBacklog }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { getPrimaryColor } = useAccentColor();
  const reducedMotion = useReducedMotion();

  if (backlog.count === 0) return null;

  const weeks = backlog.weeks_to_clear;
  const subtitle =
    weeks != null
      ? t("insights.weeksToClear", { count: Math.max(1, Math.ceil(weeks)) })
      : t("insights.noClearPace");

  // Share of this period's backlog activity that ended up watched.
  const clearedShare =
    backlog.watched_in_range + backlog.count > 0
      ? backlog.watched_in_range / (backlog.watched_in_range + backlog.count)
      : 0;

  return (
    <InsightCard title={t("insights.backlogTitle")} subtitle={subtitle}>
      <View style={styles.row}>
        <RingStat
          // Native ring props don't survive in-place updates; remount per dataset.
          key={`${backlog.count}:${backlog.watched_in_range}`}
          progress={clearedShare}
          value={String(backlog.count)}
          label={t("insights.toWatch")}
          colors={[getPrimaryColor(500), getPrimaryColor(300)]}
          trackColor={theme.backgroundSelected}
          animate={!reducedMotion}
        />
        <View style={styles.stats}>
          <StatTile value={String(backlog.movie_count)} label={t("insights.movies")} />
          <StatTile value={String(backlog.tv_count)} label={t("insights.series")} />
        </View>
      </View>
      {backlog.per_week > 0 ? (
        <Text style={[styles.pace, { color: theme.textSecondary }]}>
          {t("insights.clearPace", { count: backlog.per_week })}
        </Text>
      ) : null}
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
  },
  stats: {
    flex: 2,
    flexDirection: "row",
    gap: SPACING.SM,
  },
  pace: {
    fontSize: FONT_SIZE.XS,
  },
});
