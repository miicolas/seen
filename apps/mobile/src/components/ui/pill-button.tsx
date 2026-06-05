import { PressableScale } from "pressto";
import { StyleSheet } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface PillButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accentHex: string;
}

export function PillButton({ label, selected, onPress, accentHex }: PillButtonProps) {
  const theme = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={StyleSheet.flatten([
        styles.pill,
        { backgroundColor: selected ? accentHex : theme.backgroundElement },
      ])}>
      <Text
        size="sm"
        weight="bold"
        align="center"
        fillWidth
        color={selected ? theme.onAccent : theme.text}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 48,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.FULL,
  },
});
