import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { ChartLegend } from "@/components/insights/charts/chart-legend";
import { InsightCard } from "@/components/insights/insight-card";
import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAnalyticsTimelineItems } from "@/hooks/analytics/use-analytics-timeline-items";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTheme } from "@/hooks/use-theme";
import { formatWatchMinutes } from "@/lib/format";
import { hapticSelection } from "@/lib/haptics";
import { InsightsLineChart } from "@/lib/native-charts";
import type { Series } from "@/services/analytics";

import { MetricChips, type SeriesMetric } from "./metric-chips";
import { TimelineItemRow } from "./timeline-item-row";

const DRILL_DOWN_DELAY_MS = 400;

function bucketValue(
  bucket: Series["buckets"][number],
  metric: SeriesMetric,
): number {
  switch (metric) {
    case "watch_time":
      return bucket.total_minutes;
    case "titles":
      return bucket.media_count;
    case "episodes":
      return bucket.episode_count;
    case "avg_rating":
      return bucket.average_rating ?? 0;
  }
}

function formatMetricValue(value: number, metric: SeriesMetric): string {
  if (metric === "watch_time") return formatWatchMinutes(value);
  if (metric === "avg_rating") return value > 0 ? `${Math.round(value * 10) / 10}★` : "—";
  return String(Math.round(value));
}

// Day/month boundaries for a bucket key, built in the device's local time — which
// is the same zone the server bucketed in — so the drill-down query lines up.
function bucketRange(key: string, granularity: "day" | "month"): { from: string; to: string } {
  const [year, month, day] = key.split("-").map(Number);
  if (granularity === "month") {
    return {
      from: new Date(year, month - 1, 1).toISOString(),
      to: new Date(year, month, 1).toISOString(),
    };
  }
  return {
    from: new Date(year, month - 1, day).toISOString(),
    to: new Date(year, month - 1, day + 1).toISOString(),
  };
}

export function ActivityChartSection({ series }: { series: Series }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const reducedMotion = useReducedMotion();
  const [metric, setMetric] = useState<SeriesMetric>("watch_time");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [drillKey, setDrillKey] = useState<string | null>(null);

  const points = useMemo(
    () =>
      series.buckets.map((bucket) => ({
        label: bucket.label,
        value: bucketValue(bucket, metric),
      })),
    [series.buckets, metric],
  );

  const band = useMemo(() => {
    const bounds = series.baselines[metric];
    if (!bounds || bounds.length !== series.buckets.length) return undefined;
    return bounds.map((bound) => ({ lower: bound.p25, upper: bound.p75 }));
  }, [series.baselines, series.buckets.length, metric]);

  const average = useMemo(() => {
    const values = points.map((point) => point.value).filter((value) => value > 0);
    if (!values.length) return undefined;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [points]);

  const drillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (drillTimer.current) clearTimeout(drillTimer.current);
    },
    [],
  );

  const drillRange = drillKey ? bucketRange(drillKey, series.granularity) : null;
  const itemsQuery = useAnalyticsTimelineItems(drillRange?.from ?? null, drillRange?.to ?? null);

  // Settle scrub selection before fetching the day's items, so dragging
  // across the chart doesn't fire a request per bucket.
  const onSelectionChange = (index: number | null) => {
    if (index != null) hapticSelection();
    setSelectedIndex(index);
    if (drillTimer.current) clearTimeout(drillTimer.current);
    if (index == null) {
      setDrillKey(null);
      return;
    }
    const key = series.buckets[index]?.key ?? null;
    drillTimer.current = setTimeout(() => setDrillKey(key), DRILL_DOWN_DELAY_MS);
  };

  const currentValue =
    metric === "avg_rating"
      ? (series.summary.avg_rating.current ?? 0)
      : series.summary[metric].current;

  const deltaPct = metric === "avg_rating" ? null : series.summary[metric].delta_pct;
  const deltaText =
    deltaPct != null
      ? `${deltaPct >= 0 ? "+" : ""}${Math.round(deltaPct * 100)}% ${t("insights.vsPrevious")}`
      : null;

  const selectedBucket = selectedIndex != null ? series.buckets[selectedIndex] : null;
  const selectedBand = selectedIndex != null && band ? band[selectedIndex] : null;

  const hasData = series.buckets.some((bucket) => bucket.total_minutes > 0 || bucket.media_count > 0);

  return (
    <InsightCard>
      <View style={styles.header}>
        <Text style={[styles.hero, { color: theme.text }]}>
          {selectedBucket
            ? formatMetricValue(bucketValue(selectedBucket, metric), metric)
            : formatMetricValue(currentValue, metric)}
        </Text>
        {selectedBucket ? (
          <Text style={[styles.delta, { color: theme.textSecondary }]}>
            {selectedBucket.label}
            {selectedBand
              ? ` · ${t("insights.typicalRange", {
                  low: formatMetricValue(selectedBand.lower, metric),
                  high: formatMetricValue(selectedBand.upper, metric),
                })}`
              : ""}
          </Text>
        ) : deltaText ? (
          <Text
            style={[styles.delta, { color: deltaPct! >= 0 ? accentHex : theme.textSecondary }]}>
            {deltaText}
          </Text>
        ) : null}
      </View>

      <MetricChips
        selected={metric}
        onSelect={(next) => {
          setSelectedIndex(null);
          setDrillKey(null);
          setMetric(next);
        }}
      />

      <InsightsLineChart
        // Native chart props don't survive in-place updates (the SwiftUI view
        // blanks); remount per dataset instead.
        key={`${metric}:${series.period.range}:${series.period.from}`}
        points={points}
        band={band}
        average={average}
        averageLabel={
          average != null
            ? t("insights.avgLabel", { value: formatMetricValue(average, metric) })
            : undefined
        }
        accentColor={accentHex}
        labelColor={theme.textSecondary}
        xLabelStride={Math.max(1, Math.ceil(points.length / 7))}
        animate={!reducedMotion}
        selectionEnabled
        onSelectionChange={onSelectionChange}
        style={styles.chart}
      />

      {band ? (
        <ChartLegend
          items={[{ label: t("insights.typicalBand"), color: `${accentHex}55` }]}
        />
      ) : null}

      {!hasData ? (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {t("insights.timelineEmpty")}
        </Text>
      ) : drillKey ? (
        <View style={styles.items}>
          {(itemsQuery.data?.items ?? []).length === 0 ? (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {itemsQuery.isLoading ? t("insights.loading") : t("insights.bucketEmpty")}
            </Text>
          ) : (
            itemsQuery.data?.items.map((item) => (
              <TimelineItemRow key={`${item.kind}-${item.tmdb_id}-${item.watched_at}`} item={item} />
            ))
          )}
        </View>
      ) : (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {t("insights.scrubHint")}
        </Text>
      )}
    </InsightCard>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
  },
  hero: {
    fontSize: FONT_SIZE.HEADING_LG,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  delta: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
  chart: {
    height: 220,
    marginTop: SPACING.XS,
  },
  hint: {
    fontSize: FONT_SIZE.SM,
    paddingTop: SPACING.XS,
  },
  items: {
    gap: SPACING.SM,
    paddingTop: SPACING.XS,
  },
});
