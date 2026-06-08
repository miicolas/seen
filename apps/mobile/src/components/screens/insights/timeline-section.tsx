import { Image as ExpoImage } from "expo-image";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BarChart, type BarDatum } from "@/components/insights/bar-chart";
import { InsightCard } from "@/components/insights/insight-card";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAnalyticsTimelineItems } from "@/hooks/analytics/use-analytics-timeline-items";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { formatWatchMinutes } from "@/lib/format";
import { hapticSelection } from "@/lib/haptics";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb";
import type { Timeline, TimelineItem } from "@/services/analytics";

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

export function TimelineSection({ timeline }: { timeline: Timeline }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const bars: BarDatum[] = useMemo(
    () =>
      timeline.buckets.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        exact: bucket.watched_time.exact_minutes,
        estimated: bucket.watched_time.estimated_minutes,
      })),
    [timeline.buckets],
  );

  const range = selectedKey ? bucketRange(selectedKey, timeline.granularity) : null;
  const itemsQuery = useAnalyticsTimelineItems(range?.from ?? null, range?.to ?? null);

  const handleSelect = (bar: BarDatum) => {
    hapticSelection();
    setSelectedKey((prev) => (prev === bar.key ? null : bar.key));
  };

  const hasData = timeline.buckets.some((bucket) => bucket.total_minutes > 0);

  return (
    <InsightCard title={t("insights.timelineTitle")} subtitle={t("insights.timelineSubtitle")}>
      <BarChart
        bars={bars}
        accent={accentHex}
        selectedKey={selectedKey}
        onSelect={handleSelect}
        describeValue={formatWatchMinutes}
      />
      {!hasData ? (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {t("insights.timelineEmpty")}
        </Text>
      ) : selectedKey ? (
        <View style={styles.items}>
          {(itemsQuery.data?.items ?? []).length === 0 ? (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {itemsQuery.isLoading ? t("insights.loading") : t("insights.bucketEmpty")}
            </Text>
          ) : (
            itemsQuery.data?.items.map((item) => (
              <TimelineItemRow
                key={`${item.kind}-${item.tmdb_id}-${item.watched_at}`}
                item={item}
              />
            ))
          )}
        </View>
      ) : (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {t("insights.timelineHint")}
        </Text>
      )}
    </InsightCard>
  );
}

function TimelineItemRow({ item }: { item: TimelineItem }) {
  const theme = useTheme();
  const poster = tmdbImageUrl(item.poster_path, "w154");
  const subtitle =
    item.kind === "episode" && item.season_number != null && item.episode_number != null
      ? `S${item.season_number} E${item.episode_number}`
      : undefined;

  return (
    <Link
      href={mediaDetailHref(
        {
          id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
        },
        "insights",
      )}
      asChild>
      <Pressable style={styles.row}>
        <ExpoImage
          source={poster ? { uri: poster } : undefined}
          style={[styles.poster, { backgroundColor: theme.backgroundSelected }]}
          contentFit="cover"
        />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {item.rating != null ? (
          <Text style={[styles.rowRating, { color: theme.textSecondary }]}>{item.rating}★</Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: FONT_SIZE.SM,
    paddingTop: SPACING.XS,
  },
  items: {
    gap: SPACING.SM,
    paddingTop: SPACING.XS,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
  poster: {
    width: 36,
    height: 54,
    borderRadius: BORDER_RADIUS.SM,
    borderCurve: "continuous",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: FONT_SIZE.XS,
  },
  rowRating: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
