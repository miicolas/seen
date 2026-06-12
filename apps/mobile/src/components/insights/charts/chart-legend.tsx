import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string;
}

export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  const theme = useTheme();

  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
            {item.label}
          </Text>
          {item.value ? (
            <Text style={[styles.value, { color: theme.textSecondary }]}>{item.value}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: SPACING.MD,
    rowGap: SPACING.XS,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: FONT_SIZE.XS,
    fontWeight: "600",
  },
  value: {
    fontSize: FONT_SIZE.XS,
    fontVariant: ["tabular-nums"],
  },
});
