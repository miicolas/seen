import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";

// Small capsule used for runtime, community average, and a user's own rating.
export function MetricPill({
  icon,
  iconSize = 12,
  label,
  tint,
  background,
}: {
  icon: SFSymbol;
  iconSize?: number;
  label: string;
  tint: string;
  background: string;
}) {
  return (
    <View style={[styles.metricPill, { backgroundColor: background }]}>
      <SymbolView name={icon} size={iconSize} type="monochrome" tintColor={tint} />
      <Text size="xs" weight="bold" color={tint} inline>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricPill: {
    alignSelf: "flex-start",
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: BORDER_RADIUS.FULL,
  },
});
