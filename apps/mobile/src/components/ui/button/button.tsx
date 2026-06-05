import { Button as UIButton, Host, Label } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  font,
  frame,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useColorScheme, useWindowDimensions, View } from "react-native";

import { getColorValue } from "@/constants/colors";
import { FONT_SIZE } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { hapticTap } from "@/lib/haptics";
import type { UISize } from "@/types/ui";

import type { ButtonProps, ButtonVariant } from "./button.types";

type NativeButtonStyle = "borderedProminent" | "glassProminent" | "bordered" | "borderless";

function resolveButtonStyle(variant: ButtonVariant): NativeButtonStyle {
  if (variant === "glass") {
    return isLiquidGlassAvailable() ? "glassProminent" : "borderedProminent";
  }

  if (variant === "solid") {
    return "borderedProminent";
  }

  if (variant === "link") {
    return "borderless";
  }

  return "bordered";
}

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
  const { width: screenWidth } = useWindowDimensions();
  const { accentHex } = useAccentColor();
  const tintValue = tintColor ?? (color ? getColorValue(color, isDark ? 400 : 500) : accentHex);
  const isDisabled = disabled || loading;

  function handlePress() {
    if (isDisabled) return;
    if (haptic) hapticTap();
    onPress();
  }

  const stretch = width === "fill";
  const hostWidth = stretch ? "100%" : width;
  const labelFrame = frame({
    maxWidth: stretch ? screenWidth : typeof width === "number" ? width : undefined,
  });
  const labelTitle = loading ? "…" : title;

  return (
    <View style={stretch ? { width: "100%" } : undefined}>
      <Host
        matchContents={stretch ? { vertical: true } : true}
        style={{
          alignSelf: "center",
          ...(hostWidth != null ? { width: hostWidth } : null),
        }}>
        <UIButton
          onPress={handlePress}
          modifiers={[
            buttonStyle(resolveButtonStyle(variant)),
            controlSize("large"),
            tint(tintValue),
            disabledModifier(isDisabled),
            padding(),
          ]}>
          <Label
            title={labelTitle}
            systemImage={icon}
            modifiers={[font({ size: SIZE_TO_FONT[size], weight: "semibold" }), labelFrame]}
          />
        </UIButton>
      </Host>
    </View>
  );
}
