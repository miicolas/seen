import { StyleSheet, View } from "react-native";

import { SPACING } from "@/constants/design-tokens";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { InsightsBreakdownBar } from "@/lib/native-charts";

import { ChartLegend } from "./chart-legend";

export interface BreakdownSegment {
  label: string;
  value: number;
  color: string;
}

interface BreakdownBarWithLegendProps {
  segments: BreakdownSegment[];
  formatValue: (value: number, total: number) => string;
}

// A breakdown bar with its matching legend. Owns the remount key: native chart
// props don't survive in-place updates (the SwiftUI view blanks), so the bar
// is keyed per dataset.
export function BreakdownBarWithLegend({ segments, formatValue }: BreakdownBarWithLegendProps) {
  const reducedMotion = useReducedMotion();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (segments.length === 0 || total <= 0) return null;

  return (
    <View style={styles.root}>
      <InsightsBreakdownBar
        key={segments.map((segment) => `${segment.label}:${segment.value}`).join("|")}
        segments={segments}
        animate={!reducedMotion}
        style={styles.bar}
      />
      <ChartLegend
        items={segments.map((segment) => ({
          label: segment.label,
          color: segment.color,
          value: formatValue(segment.value, total),
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: SPACING.XS,
  },
  bar: {
    height: 16,
  },
});
