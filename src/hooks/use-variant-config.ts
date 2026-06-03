import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { getColorValue, getContrastText } from "@/constants/colors";
import {
  BORDER_WIDTH,
  COLOR_SHADES,
  OPACITY,
  THEME_SHADES,
} from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import type { ColorConfig, InputColorConfig, UIColor } from "@/types/ui";

export type BaseVariant =
  | "solid"
  | "outline"
  | "soft"
  | "subtle"
  | "link"
  | "underline";

interface VariantConfigOptions {
  includePlaceholderColor?: boolean;
  supportedVariants?: BaseVariant[];
}

/**
 * Per-variant color resolution — ported from the reference app (Endlessly).
 * Returns `{ backgroundColor, borderColor, textColor, borderWidth }` (plus
 * `placeholderColor` when requested) for each supported variant, resolved for
 * the active color scheme and accent color.
 */
export function useVariantConfig<T extends BaseVariant>(
  color?: UIColor | null,
  options: VariantConfigOptions = {},
) {
  const colorScheme = useColorScheme();
  const { accentHex } = useAccentColor();
  const {
    includePlaceholderColor = false,
    supportedVariants = [
      "solid",
      "outline",
      "soft",
      "subtle",
      "link",
      "underline",
    ] as BaseVariant[],
  } = options;

  const variantConfigs = useMemo(() => {
    const scheme = (colorScheme ?? "light") as "light" | "dark";
    const isDark = scheme === "dark";

    const createVariantConfig = (
      bgColor: string,
      textColor: string,
      borderColor: string,
      placeholderColor?: string,
    ) => {
      const baseConfig = {
        solid: {
          backgroundColor: bgColor,
          borderColor,
          // Always legible on the filled background (white on dark/saturated,
          // near-black on light) — overrides the reference app's quirk.
          textColor: getContrastText(bgColor),
          borderWidth: BORDER_WIDTH.THIN,
        },
        outline: {
          backgroundColor: "transparent",
          borderColor,
          textColor: bgColor,
          borderWidth: BORDER_WIDTH.THIN,
        },
        soft: {
          backgroundColor: `${bgColor}${
            isDark ? OPACITY.BACKGROUND_DARK : OPACITY.BACKGROUND_LIGHT
          }`,
          borderColor: "transparent",
          textColor,
          borderWidth: BORDER_WIDTH.NONE,
        },
        subtle: {
          backgroundColor: `${bgColor}${
            isDark ? OPACITY.BACKGROUND_DARK : OPACITY.BACKGROUND_LIGHT
          }`,
          borderColor,
          textColor,
          borderWidth: BORDER_WIDTH.THIN,
        },
        link: {
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: bgColor,
          borderWidth: BORDER_WIDTH.NONE,
        },
        underline: {
          backgroundColor: "transparent",
          borderColor,
          textColor: bgColor,
          borderWidth: BORDER_WIDTH.THIN,
        },
      };

      if (includePlaceholderColor && placeholderColor) {
        return Object.fromEntries(
          Object.entries(baseConfig).map(([variant, config]) => [
            variant,
            { ...config, placeholderColor },
          ]),
        );
      }

      return baseConfig;
    };

    if (color === "black") {
      const bgColor = getColorValue("black", COLOR_SHADES.DARKEST);
      const textColor = getColorValue("white", COLOR_SHADES.LIGHTEST);
      const placeholderColor = getColorValue(
        "black",
        isDark ? COLOR_SHADES.VERY_DARK : COLOR_SHADES.LIGHT,
      );
      return createVariantConfig(bgColor, textColor, bgColor, placeholderColor);
    }

    if (color === "white") {
      const bgColor = getColorValue("white", COLOR_SHADES.LIGHTEST);
      const textColor = getColorValue("white", COLOR_SHADES.DARKEST);
      const placeholderColor = getColorValue(
        "white",
        isDark ? COLOR_SHADES.SEMI_DARK : COLOR_SHADES.VERY_LIGHT,
      );
      return createVariantConfig(bgColor, textColor, bgColor, placeholderColor);
    }

    if (color === "neutral") {
      const bgColor = getColorValue("white", COLOR_SHADES.LIGHTEST);
      const textColor = isDark
        ? getColorValue("white", COLOR_SHADES.LIGHT)
        : getColorValue("black", COLOR_SHADES.LIGHT);
      const placeholderColor = getColorValue(
        color,
        isDark ? COLOR_SHADES.LIGHT : COLOR_SHADES.DARK,
      );
      return createVariantConfig(bgColor, textColor, bgColor, placeholderColor);
    }

    if (color) {
      const bgColor = getColorValue(
        color,
        isDark ? THEME_SHADES.PRIMARY.DARK : THEME_SHADES.PRIMARY.LIGHT,
      );
      const textColor = getColorValue(
        color,
        isDark ? THEME_SHADES.TEXT.LIGHT : THEME_SHADES.TEXT.DARK,
      );
      const placeholderColor = getColorValue(
        color,
        isDark ? THEME_SHADES.PLACEHOLDER.DARK : THEME_SHADES.PLACEHOLDER.LIGHT,
      );
      return createVariantConfig(bgColor, textColor, bgColor, placeholderColor);
    }

    // No explicit color → use the active accent.
    const baseHex = accentHex;
    const highContrastText = isDark
      ? getColorValue("zinc", COLOR_SHADES.LIGHTEST)
      : getColorValue("zinc", COLOR_SHADES.DARKEST);
    const placeholderColor = `${baseHex}${
      isDark ? OPACITY.PLACEHOLDER_DARK : OPACITY.PLACEHOLDER_LIGHT
    }`;
    return createVariantConfig(
      baseHex,
      highContrastText,
      baseHex,
      placeholderColor,
    );
  }, [color, colorScheme, accentHex, includePlaceholderColor]);

  return useMemo(() => {
    return Object.fromEntries(
      supportedVariants.map((variant) => [
        variant,
        variantConfigs[variant as keyof typeof variantConfigs],
      ]),
    ) as Record<T, ColorConfig | InputColorConfig>;
  }, [variantConfigs, supportedVariants]);
}
