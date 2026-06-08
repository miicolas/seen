import { StyleSheet, Text, View } from "react-native";

import { FONT_SIZE } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface StatTileProps {
  value: string;
  label: string;
  tint?: string;
}

// A compact value-over-label cell used across the hero and backlog cards.
export function StatTile({ value, label, tint }: StatTileProps) {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <Text style={[styles.value, { color: tint ?? theme.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 2,
  },
  value: {
    fontSize: FONT_SIZE.XL,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: FONT_SIZE.XS,
    fontWeight: "500",
  },
});
