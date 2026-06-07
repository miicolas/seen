import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassButton } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { LAYOUT, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

import { FeatureRow } from "./feature-row";
import { useWhatsNew } from "./use-whats-new";

export function WhatsNew() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { release, markSeen } = useWhatsNew();

  function handleContinue() {
    markSeen();
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text size="4xl" weight="bold" color={theme.text} fillWidth>
          {t("whatsNew.title")}
        </Text>

        <View style={styles.features}>
          {release?.features.map((feature, index) => (
            <FeatureRow key={`${feature.icon}-${index}`} feature={feature} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.MD) }]}>
        <GlassButton title={t("whatsNew.continue")} onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.LG,
    gap: SPACING.LG,
  },
  features: {
    gap: SPACING.LG,
  },
  footer: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: SPACING.SM,
  },
});
