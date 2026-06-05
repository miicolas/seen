import { Button as UIButton, Host } from "@expo/ui/swift-ui";
import {
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

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tintColor,
  iconColor,
  disabled = false,
  haptic = true,
  role = "default",
}: {
  icon: SFSymbol;
  accessibilityLabel: string;
  onPress: () => void;
  tintColor?: string;
  iconColor?: string;
  disabled?: boolean;
  haptic?: boolean;
  role?: "default" | "cancel" | "destructive";
}) {
  const { accentHex } = useAccentColor();
  const tintValue = tintColor ?? accentHex;

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
          buttonStyle(isLiquidGlassAvailable() ? "glassProminent" : "bordered"),
          controlSize("large"),
          tint(tintValue),
          labelStyle("iconOnly"),
          ...(iconColor ? [foregroundColor(iconColor)] : []),
          disabledModifier(disabled),
        ]}
        role={role}
      />
    </Host>
  );
}
