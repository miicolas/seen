import { useColorScheme } from "react-native";

import { getColorValue } from "@/constants/colors";
import { useAccentColor } from "@/hooks/use-accent-color";
import type { UIColor } from "@/types/ui";

const COMPANION_FAMILIES: UIColor[] = ["teal", "amber", "rose", "violet", "sky", "slate"];

// Ordered categorical palette for multi-segment charts: the user's accent
// first, then fixed companion hues tuned per color scheme.
export function useSeriesColors(): string[] {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const { accentHex } = useAccentColor();
  const shade = scheme === "dark" ? 400 : 500;
  return [accentHex, ...COMPANION_FAMILIES.map((family) => getColorValue(family, shade))];
}
