import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import type { ComponentProps } from "react";

type StackHeaderProps = ComponentProps<typeof Stack.Header>;

// Transparent, shadowless large-title header that lets content scroll underneath
// (parallax). Falls back to a system-material blur on devices without Liquid Glass.
// All props are overridable.
export function ScreenHeader(props: StackHeaderProps) {
  return (
    <Stack.Header
      transparent
      style={{ shadowColor: "transparent" }}
      blurEffect={isLiquidGlassAvailable() ? undefined : "systemMaterial"}
      {...props}
    />
  );
}
