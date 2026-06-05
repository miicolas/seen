import { SymbolView } from "expo-symbols";
import { PressableScale } from "pressto";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, eyebrow, subtitle, onSeeAll }: SectionHeaderProps) {
  const theme = useTheme();

  const content = (
    <View style={styles.row}>
      <View style={styles.column}>
        {eyebrow ? (
          <Text size="xs" weight="semibold" color={theme.textSecondary}>
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}
        <Text size="2xl" weight="bold">
          {title}
        </Text>
        {subtitle ? (
          <Text size="sm" weight="regular" color={theme.textSecondary}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onSeeAll ? (
        <SymbolView
          name="chevron.forward"
          size={18}
          type="monochrome"
          tintColor={theme.textSecondary}
        />
      ) : null}
    </View>
  );

  if (onSeeAll) {
    return (
      <PressableScale
        onPress={() => {
          hapticTap();
          onSeeAll();
        }}>
        {content}
      </PressableScale>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: SPACING.MD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.SM,
  },
  column: {
    flex: 1,
    gap: SPACING.XS,
  },
});
