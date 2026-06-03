import { useColorScheme } from "react-native";

import { getColorValue } from "@/constants/colors";
import { useAccentColorStore } from "@/store/use-accent-color-store";
import type { UIColor } from "@/types/ui";

const DEFAULT_ACCENT_FAMILY: UIColor = "indigo";

export function useAccentColor() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accentColorFamily = useAccentColorStore((s) => s.accentColorFamily);
  const setAccentColorFamilyAction = useAccentColorStore(
    (s) => s.setAccentColorFamilyAction,
  );

  const family = accentColorFamily ?? DEFAULT_ACCENT_FAMILY;

  const accentHex = getColorValue(family, scheme === "dark" ? 400 : 500);

  const getBackgroundColor = () =>
    getColorValue(family, scheme === "dark" ? 950 : 50);

  const getPrimaryColor = (shade: number) => getColorValue(family, shade);

  const setAccentFamily = (next: UIColor | null) =>
    setAccentColorFamilyAction(next);

  return { accentHex, getBackgroundColor, getPrimaryColor, setAccentFamily };
}
