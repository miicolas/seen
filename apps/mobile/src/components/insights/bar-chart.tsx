import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FONT_SIZE } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

export interface BarDatum {
  key: string;
  label: string;
  exact: number;
  estimated: number;
}

interface BarChartProps {
  bars: BarDatum[];
  accent: string;
  selectedKey?: string | null;
  onSelect?: (bar: BarDatum, index: number) => void;
  height?: number;
  // How a bar's total maps to its accessibility value (e.g. minutes → "2h").
  describeValue: (total: number) => string;
}

const DEFAULT_HEIGHT = 132;
const MIN_BAR = 3;
// Keep labels legible: only thin them out once a range packs in many buckets.
const MAX_LABELS = 12;

// A lightweight pure-RN column chart. Each bar stacks exact watched minutes (solid)
// over estimated minutes (faded), so the confidence split stays visible. No chart
// library, fixed height, tappable bars with accessible per-bucket labels.
export function BarChart({
  bars,
  accent,
  selectedKey,
  onSelect,
  height = DEFAULT_HEIGHT,
  describeValue,
}: BarChartProps) {
  const theme = useTheme();
  const max = useMemo(
    () => Math.max(1, ...bars.map((bar) => bar.exact + bar.estimated)),
    [bars],
  );
  const labelStride = Math.ceil(bars.length / MAX_LABELS);

  return (
    <View style={styles.root}>
      <View style={[styles.plot, { height }]}>
        {bars.map((bar, index) => {
          const total = bar.exact + bar.estimated;
          const barHeight = total > 0 ? Math.max(MIN_BAR, (total / max) * height) : MIN_BAR;
          const estimatedHeight = total > 0 ? (bar.estimated / total) * barHeight : 0;
          const isSelected = selectedKey === bar.key;
          const dim = selectedKey && !isSelected ? 0.4 : 1;
          return (
            <Pressable
              key={bar.key}
              style={styles.column}
              onPress={() => onSelect?.(bar, index)}
              accessibilityRole="button"
              accessibilityLabel={`${bar.label}: ${describeValue(total)}`}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: total > 0 ? accent : theme.backgroundSelected,
                    opacity: dim,
                  },
                ]}>
                {estimatedHeight > 0 ? (
                  <View
                    style={[styles.estimated, { height: estimatedHeight, backgroundColor: accent }]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        {bars.map((bar, index) => (
          <View key={bar.key} style={styles.labelCell}>
            <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>
              {index % labelStride === 0 ? bar.label : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  plot: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  column: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  estimated: {
    width: "100%",
    opacity: 0.45,
  },
  labels: {
    flexDirection: "row",
    gap: 4,
  },
  labelCell: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: FONT_SIZE.XS - 2,
  },
});
