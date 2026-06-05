import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import { getColorValue } from "@/constants/colors";
import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection } from "@/lib/haptics";
import type { UIColor, UISize } from "@/types/ui";

const STARS = [0, 1, 2, 3, 4] as const;

const SIZE_TO_GLYPH: Record<UISize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 30,
  xl: 36,
  "2xl": 44,
  "3xl": 52,
  "4xl": 60,
  "5xl": 68,
};

function symbolFor(value: number, index: number): SFSymbol {
  if (value >= index + 1) return "star.fill";
  if (value >= index + 0.5) return "star.leadinghalf.filled";
  return "star";
}

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: UISize;
  color?: UIColor;
  emptyColor?: string;
  readOnly?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = "lg",
  color,
  emptyColor,
  readOnly = false,
}: StarRatingProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  const glyph = SIZE_TO_GLYPH[size];
  const filledColor = color ? getColorValue(color, isDark ? 400 : 500) : accentHex;
  const resolvedEmptyColor = emptyColor ?? theme.textSecondary;

  function select(next: number) {
    if (readOnly || !onChange) return;
    hapticSelection();
    onChange(next);
  }

  return (
    <View style={styles.row}>
      {STARS.map((index) => {
        const symbol = symbolFor(value, index);
        const isEmpty = symbol === "star";
        return (
          <View key={index} style={{ width: glyph, height: glyph }}>
            <SymbolView
              name={symbol}
              size={glyph}
              tintColor={isEmpty ? resolvedEmptyColor : filledColor}
              style={{ width: glyph, height: glyph }}
            />
            {readOnly ? null : (
              <View style={[StyleSheet.absoluteFill, styles.tapRow]}>
                <Pressable style={styles.tapZone} onPress={() => select(index + 0.5)} />
                <Pressable style={styles.tapZone} onPress={() => select(index + 1)} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.SM,
  },
  tapRow: {
    flexDirection: "row",
  },
  tapZone: {
    flex: 1,
  },
});
