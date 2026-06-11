import { StyleSheet, View } from "react-native";

import { GlassCircleButton } from "@/components/ui/button/glass-circle-button";
import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  onDislike: () => void;
  onSkip: () => void;
  onLike: () => void;
  disabled?: boolean;
};

export function SwipeActions({ onDislike, onSkip, onLike, disabled }: Props) {
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  return (
    <View style={styles.row}>
      <GlassCircleButton
        symbol="xmark"
        tint={theme.error}
        diameter={64}
        onPress={onDislike}
        disabled={disabled}
      />
      <GlassCircleButton
        symbol="eye.slash"
        tint="rgba(255,255,255,0.8)"
        diameter={52}
        onPress={onSkip}
        disabled={disabled}
      />
      <GlassCircleButton
        symbol="heart.fill"
        tint={accentHex}
        diameter={64}
        onPress={onLike}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.LG,
  },
});
