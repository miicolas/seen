import { SymbolView } from "expo-symbols";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FONT_SIZE, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

// Shown for a brand-new user: there's nothing to chart yet, so point them at the
// two actions that seed the data (logging something, importing history).
export function InsightsEmptyState() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  return (
    <View style={styles.root}>
      <SymbolView name="chart.bar.xaxis" size={52} tintColor={theme.textSecondary} />
      <Text style={[styles.title, { color: theme.text }]}>{t("insights.emptyTitle")}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {t("insights.emptySubtitle")}
      </Text>
      <Link href="/(tabs)/discover" asChild>
        <Pressable onPress={() => hapticTap()} hitSlop={8}>
          <Text style={[styles.cta, { color: accentHex }]}>{t("insights.emptyCta")}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: SPACING.SM,
    paddingVertical: SPACING.XL,
    paddingHorizontal: SPACING.MD,
  },
  title: {
    fontSize: FONT_SIZE.XL,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZE.SM,
    textAlign: "center",
  },
  cta: {
    fontSize: FONT_SIZE.MD,
    fontWeight: "600",
    paddingTop: SPACING.XS,
  },
});
