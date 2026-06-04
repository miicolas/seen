import { isLiquidGlassAvailable } from "expo-glass-effect";

import { Button } from "./button";
import type { GlassButtonProps } from "./button.types";

// Prominent full-width primary CTA. Renders as Liquid Glass where supported and
// falls back to a solid prominent button otherwise.
export function GlassButton({ width, ...props }: GlassButtonProps) {
  return (
    <Button
      {...props}
      variant={isLiquidGlassAvailable() ? "glass" : "solid"}
      width={width ?? "fill"}
    />
  );
}
