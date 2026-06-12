import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection } from "@/lib/haptics";

export type SeriesMetric = "watch_time" | "titles" | "episodes" | "avg_rating";

const SERIES_METRICS: SeriesMetric[] = ["watch_time", "titles", "episodes", "avg_rating"];

const METRIC_LABEL_KEYS = {
  watch_time: "insights.watchedTime",
  titles: "insights.titlesLogged",
  episodes: "insights.episodes",
  avg_rating: "insights.avgRating",
} as const satisfies Record<SeriesMetric, string>;

interface MetricChipsProps {
  selected: SeriesMetric;
  onSelect: (metric: SeriesMetric) => void;
}

export function MetricChips({ selected, onSelect }: MetricChipsProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {SERIES_METRICS.map((metric) => {
        const active = metric === selected;
        return (
          <Pressable
            key={metric}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                hapticSelection();
                onSelect(metric);
              }
            }}
            style={[
              styles.chip,
              { backgroundColor: active ? theme.text : theme.backgroundSelected },
            ]}>
            <Text
              style={[styles.label, { color: active ? theme.background : theme.textSecondary }]}>
              {t(METRIC_LABEL_KEYS[metric])}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -SPACING.MD,
  },
  row: {
    gap: SPACING.XS,
    paddingHorizontal: SPACING.MD,
  },
  chip: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.FULL,
  },
  label: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "700",
  },
});
