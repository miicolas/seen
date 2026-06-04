import {
  Button as UIButton,
  Host,
  HStack,
  Image,
  Text as SwiftUIText,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  font,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useColorScheme } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { getColorValue } from "@/constants/colors";
import { FONT_SIZE } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { hapticTap } from "@/lib/haptics";
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
  "3xl": FONT_SIZE.XXL,
  "4xl": FONT_SIZE.XXXL,
  "5xl": FONT_SIZE.XXXXL,
};

export function Button({
  title,
  onPress,
  variant = "glass",
  color,
  tintColor,
  size = "md",
  icon,
  disabled = false,
  loading = false,
  haptic = true,
  width,
}: ButtonProps) {
  const isDark = useColorScheme() === "dark";
  const { accentHex } = useAccentColor();
  const tintValue =
    tintColor ?? (color ? getColorValue(color, isDark ? 400 : 500) : accentHex);
  const isDisabled = disabled || loading;

  function handlePress() {
    if (isDisabled) return;
    if (haptic) hapticTap();
    onPress();
  }

  const stretch = width === "fill";
  const contentFrame = stretch
    ? frame({ height: 16, maxWidth: Infinity })
    : width != null
      ? frame({ width, height: 16 })
      : frame({ height: 16 });

  return (
    <Host
      matchContents={stretch ? { vertical: true } : true}
      style={stretch ? { width: "100%" } : undefined}
    >
      <UIButton
        onPress={handlePress}
        modifiers={[
          buttonStyle(VARIANT_TO_STYLE[variant]),
          controlSize("large"),
          tint(tintValue),
          disabledModifier(isDisabled),
        ]}
      >
        <HStack spacing={8} modifiers={[contentFrame]}>
          {icon ? <Image systemName={icon} size={16} /> : null}
          <SwiftUIText
            modifiers={[font({ size: SIZE_TO_FONT[size], weight: "semibold" })]}
          >
            {loading ? "…" : title}
          </SwiftUIText>
        </HStack>
      </UIButton>
    </Host>
  );
}
