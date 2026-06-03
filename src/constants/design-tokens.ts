/**
 * Design tokens — ported from the reference app (Endlessly).
 * Centralized constants for consistent UI; eliminates magic numbers.
 *
 * Pairs with the `design-system` skill. `src/constants/theme.ts` keeps the
 * light/dark semantic `Colors`; this file holds the shared scales used by the
 * variant system and the `src/components/ui/*` components.
 */

// COLOR SHADES ---------------------------------------------------------------
export const COLOR_SHADES = {
  LIGHTEST: 50,
  VERY_LIGHT: 100,
  LIGHT: 400,
  MEDIUM: 500,
  SEMI_DARK: 600,
  DARK: 700,
  VERY_DARK: 800,
  DARKEST: 950,
} as const;

// OPACITY --------------------------------------------------------------------
export const OPACITY = {
  /** Subtle background opacity for light mode (hex suffix). */
  BACKGROUND_LIGHT: "10",
  /** Subtle background opacity for dark mode (hex suffix). */
  BACKGROUND_DARK: "20",
  /** Placeholder opacity for light mode (hex suffix). */
  PLACEHOLDER_LIGHT: "66",
  /** Placeholder opacity for dark mode (hex suffix). */
  PLACEHOLDER_DARK: "99",
  /** Disabled state opacity. */
  DISABLED: 0.5,
  /** Pressed state opacity. */
  PRESSED: 0.9,
  /** Muted text opacity. */
  MUTED: 0.6,
} as const;

// BORDER WIDTHS --------------------------------------------------------------
export const BORDER_WIDTH = {
  NONE: 0,
  THIN: 1,
  MEDIUM: 2,
  THICK: 3,
} as const;

// COMPONENT HEIGHTS ----------------------------------------------------------
export const COMPONENT_HEIGHT = {
  XS: 28,
  SM: 36,
  MD: 48,
  LG: 56,
  XL: 64,
  XXL: 72,
} as const;

// FONT SIZES -----------------------------------------------------------------
export const FONT_SIZE = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 22,
  XXXL: 24,
  XXXXL: 30,
  TITLE: 32,
  HEADING_LG: 36,
  HEADING_XL: 48,
  HEADING_XXL: 60,
  HEADING_XXXL: 72,
  DISPLAY: 96,
  DISPLAY_LG: 128,
  DISPLAY_XL: 160,
  DISPLAY_XXL: 192,
  DISPLAY_XXXL: 220,
} as const;

// LINE HEIGHTS ---------------------------------------------------------------
export const LINE_HEIGHT = {
  XS: 16,
  SM: 20,
  MD: 24,
  LG: 28,
  XL: 30,
  XXL: 32,
  XXXL: 36,
  XXXXL: 40,
  HEADING_LG: 44,
  HEADING_XL: 58,
  HEADING_XXL: 72,
  HEADING_XXXL: 86,
  DISPLAY: 116,
  DISPLAY_LG: 154,
  DISPLAY_XL: 192,
  DISPLAY_XXL: 230,
  DISPLAY_XXXL: 268,
} as const;

// SPACING --------------------------------------------------------------------
export const SPACING = {
  NONE: 0,
  XXS: 1,
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 32,
  XL: 48,
  XXL: 64,
} as const;

// BORDER RADIUS --------------------------------------------------------------
export const BORDER_RADIUS = {
  NONE: 0,
  SM: 8,
  MD: 16,
  LG: 24,
  FULL: 9999,
} as const;

// ANIMATION DURATIONS --------------------------------------------------------
export const DURATION = {
  QUICK: 150,
  FAST: 300,
  NORMAL: 500,
  SLOW: 1000,
  LOADING: 1000,
  SPLASH: 1000,
} as const;

// Z-INDEX LAYERS -------------------------------------------------------------
export const Z_INDEX = {
  BASE: 0,
  CONTENT: 1,
  OVERLAY: 2,
  BLUR: 3,
  MODAL: 10,
  TOOLTIP: 20,
  DROPDOWN: 30,
} as const;

// SEMANTIC MAPPINGS ----------------------------------------------------------
export const THEME_SHADES = {
  BG: { LIGHT: COLOR_SHADES.LIGHTEST, DARK: COLOR_SHADES.DARKEST },
  TEXT: { LIGHT: COLOR_SHADES.LIGHTEST, DARK: COLOR_SHADES.DARKEST },
  PRIMARY: { LIGHT: COLOR_SHADES.SEMI_DARK, DARK: COLOR_SHADES.MEDIUM },
  PLACEHOLDER: { LIGHT: COLOR_SHADES.LIGHT, DARK: COLOR_SHADES.DARK },
} as const;
