import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

import { BreakdownBarWithLegend } from "@/components/insights/charts/breakdown-bar-with-legend";
import { useSeriesColors } from "@/components/insights/charts/series-colors";
import { InsightCard } from "@/components/insights/insight-card";
import { FONT_SIZE } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import type { DiscoveryFlow, RecommendationSource } from "@/services/analytics";

function sourceLabel(t: TFunction, source: RecommendationSource): string {
  switch (source) {
    case "trending":
      return t("insights.sourceTrending");
    case "availability":
      return t("insights.sourceAvailability");
    case "content":
      return t("insights.sourceContent");
    case "collaborative":
      return t("insights.sourceCollaborative");
    case "social":
      return t("insights.sourceSocial");
  }
}

export function DiscoverySection({ flow }: { flow: DiscoveryFlow }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = useSeriesColors();

  if (flow.by_source.length === 0 || flow.totals.impressions === 0) return null;

  const segments = flow.by_source
    .filter((source) => source.impressions > 0)
    .map((source, index) => ({
      label: sourceLabel(t, source.source),
      value: source.impressions,
      color: colors[index % colors.length],
    }));

  return (
    <InsightCard title={t("insights.discoveryTitle")} subtitle={t("insights.discoverySubtitle")}>
      <BreakdownBarWithLegend segments={segments} formatValue={(value) => String(value)} />
      <Text style={[styles.outcomes, { color: theme.textSecondary }]}>
        {t("insights.discoveryOutcomes", {
          opens: flow.totals.detail_opens,
          adds: flow.totals.watchlist_adds,
          logs: flow.totals.reviews,
        })}
      </Text>
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  outcomes: {
    fontSize: FONT_SIZE.XS,
  },
});
