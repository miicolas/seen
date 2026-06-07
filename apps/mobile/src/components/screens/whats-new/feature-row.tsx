import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import type { WhatsNewFeature } from "@/constants/whats-new";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { resolveAppLanguage } from "@/lib/i18n";

const ICON_SIZE = 30;
const ICON_COLUMN = 44;

export function FeatureRow({ feature }: { feature: WhatsNewFeature }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const { accentHex } = useAccentColor();
  const lang = resolveAppLanguage(i18n.language);

  return (
    <View style={styles.row}>
      <View style={styles.iconColumn}>
        <SymbolView name={feature.icon} size={ICON_SIZE} tintColor={accentHex} />
      </View>
      <View style={styles.body}>
        <Text size="lg" weight="bold" color={theme.text} fillWidth>
          {feature.title[lang]}
        </Text>
        <Text size="md" weight="regular" color={theme.textSecondary} fillWidth>
          {feature.description[lang]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.MD,
  },
  iconColumn: {
    width: ICON_COLUMN,
    alignItems: "center",
    paddingTop: SPACING.XS,
  },
  body: {
    flex: 1,
    gap: SPACING.XS,
  },
});
