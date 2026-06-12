import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Segmented } from "@/components/ui/segmented";
import { LAYOUT, SPACING } from "@/constants/design-tokens";
import { BottomTabInset } from "@/constants/theme";
import { useAnalyticsDiscoveryFlow } from "@/hooks/analytics/use-analytics-discovery-flow";
import { useAnalyticsOverview } from "@/hooks/analytics/use-analytics-overview";
import { useAnalyticsSeries } from "@/hooks/analytics/use-analytics-series";
import { useAnalyticsStreaks } from "@/hooks/analytics/use-analytics-streaks";
import { useAnalyticsTaste } from "@/hooks/analytics/use-analytics-taste";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection, hapticTap } from "@/lib/haptics";
import type { AnalyticsRange } from "@/services/analytics";

import { ActivityChartSection } from "./activity-chart-section";
import { BacklogSection } from "./backlog-section";
import { BreakdownSection } from "./breakdown-section";
import { DiscoverySection } from "./discovery-section";
import { InsightsEmptyState } from "./empty-state";
import { PeriodNavigator } from "./period-navigator";
import { RingsRow } from "./rings-row";
import { StreakSection } from "./streak-section";
import { TasteSection } from "./taste-section";

const RANGES: AnalyticsRange[] = ["week", "month", "year", "all"];

export function Insights() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<AnalyticsRange>("week");
  const [offset, setOffset] = useState(0);

  const openShare = () => {
    hapticTap();
    router.push("/share-recap");
  };

  const series = useAnalyticsSeries(range, offset);
  const overview = useAnalyticsOverview(range, offset);
  const taste = useAnalyticsTaste(range, offset);
  const streaks = useAnalyticsStreaks();
  const discovery = useAnalyticsDiscoveryFlow(range);

  const rangeOptions = useMemo(
    () => RANGES.map((value) => ({ value, label: t(`insights.range.${value}`) })),
    [t],
  );

  const onRangeChange = (value: AnalyticsRange) => {
    setRange(value);
    setOffset(0);
    hapticSelection();
  };

  const navigatePeriod = (delta: number) => {
    hapticSelection();
    setOffset((current) => Math.max(0, current + delta));
  };

  const ov = overview.data;
  const isEmpty =
    !!ov &&
    offset === 0 &&
    ov.media_count === 0 &&
    ov.episode_count === 0 &&
    ov.watchlist_backlog.count === 0;

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={openShare}>
          {t("insights.shareTitle")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + SPACING.LG },
        ]}>
        <Segmented options={rangeOptions} selection={range} onChange={onRangeChange} />

        {series.isLoading && overview.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : series.error || overview.error ? (
          <Text style={[styles.error, { color: theme.textSecondary }]}>
            {t("insights.loadError")}
          </Text>
        ) : isEmpty ? (
          <InsightsEmptyState />
        ) : (
          <>
            <PeriodNavigator
              range={range}
              period={series.data?.period}
              onPrevious={() => navigatePeriod(1)}
              onNext={() => navigatePeriod(-1)}
            />
            {series.data ? <ActivityChartSection series={series.data} /> : null}
            {streaks.data ? <StreakSection streaks={streaks.data} /> : null}
            {series.data ? <RingsRow series={series.data} /> : null}
            {taste.data ? <BreakdownSection taste={taste.data} /> : null}
            {taste.data ? <TasteSection taste={taste.data} /> : null}
            {ov ? <BacklogSection backlog={ov.watchlist_backlog} /> : null}
            {discovery.data ? <DiscoverySection flow={discovery.data} /> : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: SPACING.SM,
    gap: SPACING.MD,
  },
  center: {
    paddingVertical: SPACING.XL,
    alignItems: "center",
  },
  error: {
    paddingVertical: SPACING.LG,
    textAlign: "center",
  },
});
