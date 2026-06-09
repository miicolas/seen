// The auth screen renders over fixed dark artwork, so it is intentionally
// theme-independent: always-dark surface, always-light text.
export const ONBOARDING_COLORS = {
  surface: "#000000",
  text: "#ffffff",
  textMuted: "#ffffffB3",
  error: "#ff453a",
} as const;

export const DARK_GRADIENT = ["transparent", "#00000040", "#000000B0", "#000000"] as const;
