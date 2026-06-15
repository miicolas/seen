import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

export function PersonSummary({ name, role }: { name: string; role?: string | null }) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <Text size="3xl" weight="bold" color={theme.text} align="center" fillWidth numberOfLines={2}>
        {name}
      </Text>
      {role ? (
        <Text size="sm" weight="medium" color={theme.textSecondary} align="center" fillWidth>
          {role}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: SPACING.XS,
    paddingTop: SPACING.SM,
  },
});
