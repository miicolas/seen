import { Pressable, StyleSheet } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, OPACITY, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface PillButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accentHex: string;
}

export function PillButton({
  label,
  selected,
  onPress,
  accentHex,
}: PillButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: selected ? accentHex : theme.backgroundElement },
        pressed ? { opacity: OPACITY.PRESSED } : null,
      ]}>
      <Text
        size="sm"
        weight="bold"
        color={selected ? theme.onAccent : theme.text}>
        {label}
      </Text>
    </Pressable>
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
