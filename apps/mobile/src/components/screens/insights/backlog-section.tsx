import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { InsightCard } from "@/components/insights/insight-card";
import { StatTile } from "@/components/insights/stat-tile";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import type { WatchlistBacklog } from "@/services/analytics";

export function BacklogSection({ backlog }: { backlog: WatchlistBacklog }) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (backlog.count === 0) return null;

  const weeks = backlog.weeks_to_clear;
  const subtitle =
    weeks != null
      ? t("insights.weeksToClear", { count: Math.max(1, Math.ceil(weeks)) })
      : t("insights.noClearPace");

  return (
    <InsightCard title={t("insights.backlogTitle")} subtitle={subtitle}>
      <View style={styles.stats}>
        <StatTile value={String(backlog.count)} label={t("insights.toWatch")} />
        <StatTile value={String(backlog.movie_count)} label={t("insights.movies")} />
        <StatTile value={String(backlog.tv_count)} label={t("insights.series")} />
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
  stats: {
    flexDirection: "row",
    gap: SPACING.SM,
  },
  pace: {
    fontSize: FONT_SIZE.XS,
  },
});
