import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { OPACITY, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

interface SettingsRowProps {
  label: string;
  value?: string | null;
  subtitle?: string | null;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

// A single label / value row inside a Section card. Pressable when `onPress`.
export function SettingsRow({
  label,
  value,
  subtitle,
  trailing,
  onPress,
  destructive = false,
  disabled = false,
}: SettingsRowProps) {
  const theme = useTheme();
  const labelColor = destructive ? theme.error : theme.text;

  const content = (
    <View style={styles.row}>
      <View style={styles.labels}>
        <Text size="md" weight="medium" color={labelColor}>
          {label}
        </Text>
        {subtitle ? (
          <Text size="sm" color={theme.textSecondary}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (value ? (
          <Text size="md" color={theme.textSecondary} numberOfLines={1}>
            {value}
          </Text>
        ) : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        hapticTap();
        onPress();
      }}
      style={({ pressed }) => ({
        opacity: disabled ? OPACITY.DISABLED : pressed ? OPACITY.MUTED : 1,
      })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.MD,
    minHeight: 36,
  },
  labels: {
    flexShrink: 1,
    gap: 2,
  },
});
