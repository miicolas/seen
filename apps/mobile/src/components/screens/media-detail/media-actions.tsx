import { StyleSheet, View } from "react-native";

import { GlassButton } from "@/components/ui/button";
import { SPACING } from "@/constants/design-tokens";

export function MediaActions({
  hasRating,
  accentHex,
  onRate,
  reviewedLabel = "Rated",
  unreviewedLabel = "Mark as seen",
}: {
  hasRating: boolean;
  accentHex: string;
  onRate: () => void;
  reviewedLabel?: string;
  unreviewedLabel?: string;
}) {
  return (
    <View style={styles.actionContainer}>
      <GlassButton
        icon={hasRating ? "checkmark" : "star.fill"}
        title={hasRating ? reviewedLabel : unreviewedLabel}
        tintColor={accentHex}
        onPress={onRate}
        width={180}
        haptic={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.MD,
    marginTop: SPACING.SM,
  },
});
