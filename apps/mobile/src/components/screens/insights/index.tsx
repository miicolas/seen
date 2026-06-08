import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SFSymbol } from "sf-symbols-typescript";

import { Segmented } from "@/components/ui/segmented";
import { LAYOUT, SPACING } from "@/constants/design-tokens";
import { BottomTabInset } from "@/constants/theme";
import { useAnalyticsDiscoveryFlow } from "@/hooks/analytics/use-analytics-discovery-flow";
import { useAnalyticsOverview } from "@/hooks/analytics/use-analytics-overview";
import { useAnalyticsTaste } from "@/hooks/analytics/use-analytics-taste";
import { useAnalyticsTimeline } from "@/hooks/analytics/use-analytics-timeline";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection, hapticTap } from "@/lib/haptics";
import type { AnalyticsRange, ShareTemplate } from "@/services/analytics";

import { BacklogSection } from "./backlog-section";
import { DiscoverySection } from "./discovery-section";
import { InsightsEmptyState } from "./empty-state";
import { EraSection } from "./era-section";
import { HeroSection } from "./hero-section";
import { TasteSection } from "./taste-section";
import { TimelineSection } from "./timeline-section";

const RANGES: AnalyticsRange[] = ["week", "month", "year", "all"];

export function Insights() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<AnalyticsRange>("week");

  const openShare = (template: ShareTemplate) => {
    hapticTap();
    router.push({ pathname: "/share-recap", params: { template } });
  };

  const shareOptions: { template: ShareTemplate; label: string; icon: SFSymbol }[] = [
    { template: "weekly", label: t("insights.shareWeekly"), icon: "calendar" },
    { template: "taste", label: t("insights.shareTaste"), icon: "sparkles" },
    { template: "watchlist", label: t("insights.shareWatchlist"), icon: "bookmark" },
  ];

  const overview = useAnalyticsOverview(range);
  const timeline = useAnalyticsTimeline(range);
  const taste = useAnalyticsTaste(range);
  const discovery = useAnalyticsDiscoveryFlow(range);

  const rangeOptions = useMemo(
    () => RANGES.map((value) => ({ value, label: t(`insights.range.${value}`) })),
    [t],
  );

  const onRangeChange = (value: AnalyticsRange) => {
    setRange(value);
    hapticSelection();
  };

  const ov = overview.data;
  const isEmpty =
    !!ov && ov.media_count === 0 && ov.episode_count === 0 && ov.watchlist_backlog.count === 0;

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="square.and.arrow.up">
          <Stack.Toolbar.Label>{t("insights.shareTitle")}</Stack.Toolbar.Label>
          {shareOptions.map((option) => (
            <Stack.Toolbar.MenuAction
              key={option.template}
              icon={option.icon}
              onPress={() => openShare(option.template)}>
              {option.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + SPACING.LG },
        ]}>
        <Segmented options={rangeOptions} selection={range} onChange={onRangeChange} />

        {overview.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : overview.error ? (
          <Text style={[styles.error, { color: theme.textSecondary }]}>
            {t("insights.loadError")}
          </Text>
        ) : isEmpty ? (
          <InsightsEmptyState />
        ) : (
          <>
            {ov ? <HeroSection overview={ov} /> : null}
            {timeline.data ? <TimelineSection timeline={timeline.data} /> : null}
            {ov ? <EraSection era={ov.current_era} /> : null}
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
