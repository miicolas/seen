import { SymbolView } from "expo-symbols";
import { PressableScale } from "pressto";
import { StyleSheet } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { GlassPanel } from "@/components/ui/glass-panel";
import { BORDER_RADIUS } from "@/constants/design-tokens";

interface GlassCircleButtonProps {
  symbol: SFSymbol;
  tint: string;
  diameter: number;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Solid background on devices without Liquid Glass; defaults to a soft white veil for dark surfaces. */
  fallbackColor?: string;
}

// Circular Liquid Glass icon button for RN surfaces (e.g. over blurred artwork),
// where the expo-ui glass button variants can't be layered.
export function GlassCircleButton({
  symbol,
  tint,
  diameter,
  onPress,
  disabled,
  accessibilityLabel,
  fallbackColor = "rgba(255,255,255,0.12)",
}: GlassCircleButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled === true }}
      onPress={() => {
        if (!disabled) onPress();
      }}
      style={StyleSheet.flatten([{ opacity: disabled ? 0.4 : 1 }])}>
      <GlassPanel
        fallbackColor={fallbackColor}
        style={StyleSheet.flatten([
          styles.circle,
          { width: diameter, height: diameter, borderRadius: BORDER_RADIUS.FULL },
        ])}>
        <SymbolView name={symbol} size={diameter * 0.42} tintColor={tint} />
      </GlassPanel>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
