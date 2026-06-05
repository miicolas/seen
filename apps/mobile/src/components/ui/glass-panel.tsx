import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

interface GlassPanelProps {
  children: ReactNode;
  /** Solid background used on devices without Liquid Glass (iOS < 26, simulator). */
  fallbackColor: string;
  style?: ViewStyle;
}

// A translucent surface that uses native Liquid Glass when the OS supports it and
// falls back to a solid fill otherwise. Keeps the glass/no-glass branch in one place.
export function GlassPanel({ children, fallbackColor, style }: GlassPanelProps) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle="regular" style={style}>
        {children}
      </GlassView>
    );
  }

  return <View style={[style, { backgroundColor: fallbackColor }]}>{children}</View>;
}
