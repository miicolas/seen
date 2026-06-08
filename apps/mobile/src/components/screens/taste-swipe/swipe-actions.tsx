import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
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
      <ActionButton
        symbol="xmark"
        tint={theme.error}
        diameter={64}
        background={theme.backgroundElement}
        onPress={onDislike}
        disabled={disabled}
      />
      <ActionButton
        symbol="eye.slash"
        tint={theme.textSecondary}
        diameter={52}
        background={theme.backgroundElement}
        onPress={onSkip}
        disabled={disabled}
      />
      <ActionButton
        symbol="heart.fill"
        tint={accentHex}
        diameter={64}
        background={theme.backgroundElement}
        onPress={onLike}
        disabled={disabled}
      />
    </View>
  );
}

type ActionButtonProps = {
  symbol: SFSymbol;
  tint: string;
  diameter: number;
  background: string;
  onPress: () => void;
  disabled?: boolean;
};

function ActionButton({
  symbol,
  tint,
  diameter,
  background,
  onPress,
  disabled,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: diameter,
          height: diameter,
          borderRadius: BORDER_RADIUS.FULL,
          backgroundColor: background,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}>
      <SymbolView name={symbol} size={diameter * 0.42} tintColor={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.LG,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
