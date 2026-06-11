import { Button as UIButton, Host } from "@expo/ui/swift-ui";
import {
  Animation,
  animation,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  foregroundColor,
  labelStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import type { SFSymbol } from "sf-symbols-typescript";

import { useAccentColor } from "@/hooks/use-accent-color";
import { hapticTap } from "@/lib/haptics";
import { symbolReplaceTransition } from "@/lib/symbol-replace-transition";

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tintColor,
  iconColor,
  variant = "prominent",
  size = "large",
  disabled = false,
  haptic = true,
  role = "default",
  symbolTransitionValue,
}: {
  icon: SFSymbol;
  accessibilityLabel: string;
  onPress: () => void;
  tintColor?: string;
  iconColor?: string;
  /** prominent = accent-filled glass; glass = neutral translucent glass. */
  variant?: "prominent" | "glass";
  size?: "regular" | "large" | "extraLarge";
  disabled?: boolean;
  haptic?: boolean;
  role?: "default" | "cancel" | "destructive";
  symbolTransitionValue?: number | boolean;
}) {
  const { accentHex } = useAccentColor();
  const tintValue = tintColor ?? accentHex;
  const symbolTransitionModifiers =
    symbolTransitionValue == null
      ? []
      : [symbolReplaceTransition(), animation(Animation.default, symbolTransitionValue)];

  function handlePress() {
    if (disabled) return;
    if (haptic) hapticTap();
    onPress();
  }

  return (
    <Host matchContents>
      <UIButton
        label={accessibilityLabel}
        systemImage={icon}
        onPress={handlePress}
        modifiers={[
          buttonStyle(
            isLiquidGlassAvailable()
              ? variant === "glass"
                ? "glass"
                : "glassProminent"
              : "bordered",
          ),
          controlSize(size),
          tint(tintValue),
          labelStyle("iconOnly"),
          ...symbolTransitionModifiers,
          ...(iconColor ? [foregroundColor(iconColor)] : []),
          disabledModifier(disabled),
        ]}
        role={role}
      />
    </Host>
  );
}
