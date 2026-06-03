import { useColorScheme } from "react-native";

import { getColorValue } from "@/constants/colors";
import { useAccentColorStore } from "@/store/use-accent-color-store";
import type { UIColor } from "@/types/ui";

// Seen's default accent (used when the user hasn't picked a family). Only the
// theme/accent differs from the reference app — everything else is shared.
const DEFAULT_ACCENT_FAMILY: UIColor = "indigo";

/**
 * Resolves the active accent color (light/dark aware), backed by the persisted
 * `use-accent-color-store`. Replaces the reference app's context Provider with a
 * plain hook — no provider needed.
 */
export function useAccentColor() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accentColorFamily = useAccentColorStore((s) => s.accentColorFamily);
  const setAccentColorFamilyAction = useAccentColorStore(
    (s) => s.setAccentColorFamilyAction,
  );

  const family = accentColorFamily ?? DEFAULT_ACCENT_FAMILY;

  // The main accent hex, shifted lighter in dark mode for contrast.
  const accentHex = getColorValue(family, scheme === "dark" ? 400 : 500);

  // Tinted page background derived from the accent.
  const getBackgroundColor = () =>
    getColorValue(family, scheme === "dark" ? 950 : 50);

  // Arbitrary shade of the active accent family.
  const getPrimaryColor = (shade: number) => getColorValue(family, shade);

  // Set the accent by family name, or `null` to reset to the default.
  const setAccentFamily = (next: UIColor | null) =>
    setAccentColorFamilyAction(next);

  return { accentHex, getBackgroundColor, getPrimaryColor, setAccentFamily };
}
