import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface EmptyStateProps {
  icon: SFSymbol;
  title: string;
  subtitle?: string;
  /** Optional call-to-action, e.g. a <GlassButton /> pointing somewhere useful. */
  action?: ReactNode;
}

// A non-blank empty state: an icon, what goes here, and (optionally) what to do
// next. Use instead of leaving a list or section visually empty.
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <SymbolView name={icon} size={44} tintColor={theme.textSecondary} />
      <View style={styles.copy}>
        <Text size="md" weight="bold" align="center" fillWidth>
          {title}
        </Text>
        {subtitle ? (
          <Text size="sm" weight="regular" color={theme.textSecondary} align="center" fillWidth>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.MD,
    paddingHorizontal: SPACING.LG,
  },
  copy: {
    gap: SPACING.XS,
  },
});
