import type { SFSymbol } from "sf-symbols-typescript";

import type { UIColor, UISize } from "@/types/ui";

export type ButtonVariant = "solid" | "glass" | "soft" | "outline" | "link";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  color?: UIColor;
  tintColor?: string;
  size?: UISize;
  icon?: SFSymbol;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  width?: number | "fill";
}

// A prominent full-width CTA. Variant is chosen by the platform (Liquid Glass when
// available), so callers only pass content/state.
export type GlassButtonProps = Omit<ButtonProps, "variant">;
