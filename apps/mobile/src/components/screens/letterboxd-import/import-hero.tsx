import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

const ICON_TILE = 64;
// Background of the Letterboxd decal, so the round logo sits on a matching square tile.
const LETTERBOXD_DARK = "#202830";

// Apple Music transfer-style hero shown above the import form during onboarding:
// Letterboxd app tile → arrow → Seen app tile, then big bold title and muted subtitle.
export function ImportHero() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.icons}>
        <View style={[styles.tile, { backgroundColor: LETTERBOXD_DARK }]}>
          <Image
            source={require("@/assets/images/letterboxd-logo.png")}
            style={styles.letterboxdLogo}
            contentFit="contain"
          />
        </View>
        <SymbolView name="arrow.right" size={24} tintColor={theme.textSecondary} />
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.tile}
          contentFit="cover"
        />
      </View>
      <Text fillWidth size="4xl" weight="bold" color={theme.text} align="center">
        {t("import.title")}
      </Text>
      <Text inline size="md" weight="regular" color={theme.textSecondary} align="center">
        {t("import.subtitle")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: SPACING.SM,
    paddingHorizontal: SPACING.LG,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  tile: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  letterboxdLogo: {
    width: ICON_TILE * 0.78,
    height: ICON_TILE * 0.78,
  },
});
