// Shared UI component types — ported from the reference app (Endlessly).

export type UISize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export type UIRadius =
  | "none"
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "default"
  | "lg"
  | "xl"
  | "full";

export type UIColor =
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "black"
  | "white";

// Shared radius values mapping (px).
export const RADIUS_VALUES: Record<UIRadius, number> = {
  none: 0,
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  default: 14,
  lg: 16,
  xl: 20,
  full: 32,
};

// Resolved per-variant color configuration.
export interface ColorConfig {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderWidth: number;
}

// Extended config for inputs (adds placeholder color).
export interface InputColorConfig extends ColorConfig {
  placeholderColor: string;
}
