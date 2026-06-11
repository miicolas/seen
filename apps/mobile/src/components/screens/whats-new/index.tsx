import { Host, ScrollView, Text as SwiftUIText, VStack } from "@expo/ui/swift-ui";
import { font, foregroundColor, frame, padding } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassButton } from "@/components/ui/button";
import { FONT_SIZE, LAYOUT, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

import { FeatureRow } from "./feature-row";
import { useWhatsNew } from "./use-whats-new";

// What's New announcement sheet. The scrollable content is native SwiftUI in a
// flex:1 Host (the working formSheet pattern — an RN ScrollView here gets its
// frame hijacked by react-native-screens' sheet layout and renders blank).
export function WhatsNew() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { features, markSeen } = useWhatsNew();

  function handleContinue() {
    markSeen();
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Host matchContents={false} useViewportSizeMeasurement style={styles.host}>
        <ScrollView showsIndicators={false}>
          <VStack
            alignment="leading"
            spacing={SPACING.LG}
            modifiers={[
              padding({
                horizontal: LAYOUT.SCREEN_PADDING,
                top: SPACING.XL,
                bottom: SPACING.LG,
              }),
            ]}>
            <SwiftUIText
              modifiers={[
                font({ size: FONT_SIZE.XXXXL, weight: "bold" }),
                foregroundColor(theme.text),
                frame({ maxWidth: 10000, alignment: "leading" }),
              ]}>
              {t("whatsNew.title")}
            </SwiftUIText>

            {features.length > 0 ? (
              features.map((feature, index) => (
                <FeatureRow key={`${feature.icon}-${index}`} feature={feature} />
              ))
            ) : (
              <SwiftUIText
                modifiers={[font({ size: FONT_SIZE.MD }), foregroundColor(theme.textSecondary)]}>
                {t("whatsNew.empty")}
              </SwiftUIText>
            )}
          </VStack>
        </ScrollView>
      </Host>

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
  host: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: SPACING.SM,
  },
});
