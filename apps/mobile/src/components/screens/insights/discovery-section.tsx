import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { InsightCard } from "@/components/insights/insight-card";
import { LabeledBar } from "@/components/insights/labeled-bar";
import { FONT_SIZE } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
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
  const { accentHex } = useAccentColor();

  if (flow.by_source.length === 0 || flow.totals.impressions === 0) return null;

  const maxImpressions = Math.max(1, ...flow.by_source.map((source) => source.impressions));

  return (
    <InsightCard title={t("insights.discoveryTitle")} subtitle={t("insights.discoverySubtitle")}>
      {flow.by_source.map((source) => (
        <View key={source.source} style={styles.block}>
          <LabeledBar
            label={sourceLabel(t, source.source)}
            value={source.impressions}
            max={maxImpressions}
            trailing={String(source.impressions)}
            color={accentHex}
          />
          <Text style={[styles.outcomes, { color: theme.textSecondary }]}>
            {t("insights.discoveryOutcomes", {
              opens: source.detail_opens,
              adds: source.watchlist_adds,
              logs: source.reviews,
            })}
          </Text>
        </View>
      ))}
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 2,
  },
  outcomes: {
    fontSize: FONT_SIZE.XS,
  },
});
