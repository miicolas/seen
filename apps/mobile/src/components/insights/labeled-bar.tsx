import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface LabeledBarProps {
  label: string;
  value: number;
  max: number;
  trailing: string;
  color: string;
}

// A horizontal progress-style row: label + trailing figure over a proportional
// track. Reused for genre mix, discovery sources and the rating histogram.
export function LabeledBar({ label, value, max, trailing, color }: LabeledBarProps) {
  const theme = useTheme();
  const fraction = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  return (
    <View style={styles.root} accessibilityRole="text" accessibilityLabel={`${label}: ${trailing}`}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.trailing, { color: theme.textSecondary }]}>{trailing}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[styles.fill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 4,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: FONT_SIZE.SM,
    fontWeight: "500",
  },
  trailing: {
    fontSize: FONT_SIZE.SM,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 8,
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    borderCurve: "continuous",
  },
});
