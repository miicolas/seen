import { StyleSheet } from "react-native";

import { Text } from "@/components/ui/text";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ALWAYS_DARK_COLORS } from "@/constants/always-dark";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";

interface ProgressPillProps {
  label: string;
}

// Small Liquid Glass capsule showing "X of Y" progress over the blurred artwork.
export function ProgressPill({ label }: ProgressPillProps) {
  return (
    <GlassPanel fallbackColor="rgba(255,255,255,0.12)" style={styles.pill}>
      <Text inline size="xs" weight="semibold" color={ALWAYS_DARK_COLORS.text}>
        {label}
      </Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "center",
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS + 2,
    borderRadius: BORDER_RADIUS.FULL,
    overflow: "hidden",
  },
});
