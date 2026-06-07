import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection, hapticTap } from "@/lib/haptics";
import { useOnboardingStore } from "@/store/use-onboarding-store";

const LETTERBOXD_RED = "#E74A3B";
const CTA_BACKGROUND = "#D8E5F2";
const CTA_TEXT = "#0878D8";

export function LetterboxdImportBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const completed = useOnboardingStore((state) => state.completed);
  const importStatus = useOnboardingStore((state) => state.letterboxdImportStatus);
  const dismiss = useOnboardingStore((state) => state.dismissLetterboxdImportPromptAction);

  if (!completed || importStatus !== "skipped") return null;

  function handleStart() {
    hapticTap();
    router.push("/import-letterboxd");
  }

  function handleDismiss() {
    hapticSelection();
    dismiss();
  }

  return (
    <View style={style}>
      <View style={[styles.root, { backgroundColor: theme.backgroundElement }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("import.bannerDismiss")}
          onPress={handleDismiss}
          style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
          <SymbolView name="xmark" size={13} tintColor={theme.textSecondary} />
        </Pressable>

        <View style={styles.copyRow}>
          <View style={styles.iconBox}>
            <SymbolView name="square.and.arrow.down" size={31} tintColor={LETTERBOXD_RED} />
          </View>
          <Text size="sm" weight="bold" color={theme.text} fillWidth numberOfLines={3}>
            {t("import.bannerTitle")}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleStart}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.82 : 1 }]}>
          <Text size="xs" weight="semibold" color={CTA_TEXT} inline>
            {t("import.bannerAction")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: 260,
    borderRadius: BORDER_RADIUS.MD,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    gap: SPACING.SM,
    alignSelf: "flex-start",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  copyRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
    paddingRight: 18,
  },
  iconBox: {
    width: 47,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    minHeight: 34,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: CTA_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.MD,
  },
});
