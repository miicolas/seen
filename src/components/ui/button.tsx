import {
  Button as UIButton,
  Host,
  HStack,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  clipShape,
  controlSize,
  disabled as disabledModifier,
  font,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useColorScheme } from "react-native";

import { getColorValue } from "@/constants/colors";
import { FONT_SIZE } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { hapticTap } from "@/lib/haptics";
import type { UIColor, UISize } from "@/types/ui";

// Native SwiftUI button styles we map our variants onto.
export type ButtonVariant =
  | "solid" // filled, prominent (native borderedProminent)
  | "glass" // liquid-glass prominent (like the onboarding CTA)
  | "soft" // tinted light fill (native bordered)
  | "outline" // bordered
  | "link"; // text-only (native borderless)

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Accent family; defaults to the app accent. */
  color?: UIColor;
  size?: UISize;
  disabled?: boolean;
  loading?: boolean;
  /** Fire `hapticTap` on press. @default true */
  haptic?: boolean;
  /** Fixed width in px (e.g. for full-width CTAs). Hugs content when omitted. */
  width?: number;
}

const VARIANT_TO_STYLE: Record<
  ButtonVariant,
  "borderedProminent" | "glassProminent" | "bordered" | "borderless"
> = {
  solid: "borderedProminent",
  glass: "glassProminent",
  soft: "bordered",
  outline: "bordered",
  link: "borderless",
};

const SIZE_TO_FONT: Record<UISize, number> = {
  xs: FONT_SIZE.XS,
  sm: FONT_SIZE.SM,
  md: FONT_SIZE.MD,
  lg: FONT_SIZE.MD,
  xl: FONT_SIZE.LG,
  "2xl": FONT_SIZE.XL,
};

const HEIGHT_FOR_FRAME: Record<UISize, number> = {
  xs: 32,
  sm: 38,
  md: 44,
  lg: 48,
  xl: 52,
  "2xl": 56,
};

/**
 * SwiftUI-first button using **native** button styles (filled / glass / bordered
 * / borderless) tinted with the app accent — same family of CTAs as the
 * onboarding screen, with native press feedback and a capsule shape.
 */
export function Button({
  title,
  onPress,
  variant = "glass",
  color,
  size = "md",
  disabled = false,
  loading = false,
  haptic = true,
  width,
}: ButtonProps) {
  const isDark = useColorScheme() === "dark";
  const { accentHex } = useAccentColor();
  const tintColor = color ? getColorValue(color, isDark ? 400 : 500) : accentHex;
  const isDisabled = disabled || loading;

  function handlePress() {
    if (isDisabled) return;
    if (haptic) hapticTap();
    onPress();
  }

  return (
    <Host matchContents>
      <UIButton
        onPress={handlePress}
        modifiers={[
          buttonStyle(VARIANT_TO_STYLE[variant]),
          // Minimal native chrome so the frame height below controls the size
          // precisely (same approach as the onboarding CTA).
          controlSize("mini"),
          tint(tintColor),
          clipShape("capsule"),
          disabledModifier(isDisabled),
        ]}>
        <HStack
          modifiers={[
            frame({
              height: HEIGHT_FOR_FRAME[size],
              ...(width ? { width } : {}),
            }),
          ]}>
          <SwiftUIText
            modifiers={[
              font({ size: SIZE_TO_FONT[size], weight: "semibold" }),
            ]}>
            {loading ? "…" : title}
          </SwiftUIText>
        </HStack>
      </UIButton>
    </Host>
  );
}
