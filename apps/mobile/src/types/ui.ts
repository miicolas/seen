export type UISize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

export type UIRadius = "none" | "xxs" | "xs" | "sm" | "md" | "default" | "lg" | "xl" | "full";

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

export interface ColorConfig {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderWidth: number;
}

export interface InputColorConfig extends ColorConfig {
  placeholderColor: string;
}
