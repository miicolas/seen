import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

// Compact promo card nudging the user to pick their streaming services. Lives
// inline between the discover shelves, so it stays on the page rhythm instead of
// reading as a full-screen empty state.
export function PlatformsPrompt() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  return (
    <View style={styles.container}>
      <GlassPanel fallbackColor={theme.backgroundElement} style={styles.panel}>
        <View style={styles.header}>
          <SymbolView name="tv" size={20} tintColor={accentHex} style={styles.icon} />
          <View style={styles.copy}>
            <Text inline size="md" weight="semibold" color={theme.text} numberOfLines={1}>
              {t("discover.pickPlatformsTitle")}
            </Text>
            <Text inline size="sm" weight="regular" color={theme.textSecondary} numberOfLines={2}>
              {t("discover.pickPlatformsSubtitle")}
            </Text>
          </View>
        </View>
        <Button
          title={t("discover.pickPlatformsAction")}
          size="sm"
          width="fill"
          onPress={() => {
            hapticTap();
            router.push("/profile/platforms");
          }}
        />
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.MD,
  },
  panel: {
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    gap: SPACING.MD,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.SM,
  },
  icon: {
    marginTop: SPACING.XXS,
  },
  copy: {
    flex: 1,
    gap: SPACING.XXS,
  },
});
