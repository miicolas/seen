import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button/button";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

import { SwipeDeck } from "./swipe-deck";
import { useTasteSwipe } from "./use-taste-swipe";

export function TasteSwipe() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const swipe = useTasteSwipe();

  const showContinue = !swipe.isLoading && (swipe.hasError || swipe.total === 0);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + SPACING.LG,
          paddingBottom: insets.bottom + SPACING.MD,
        },
      ]}>
      <View style={styles.header}>
        <Text size="3xl" weight="bold" color={theme.text}>
          {t("taste.onboardingTitle")}
        </Text>
        <Text inline size="md" weight="regular" color={theme.textSecondary}>
          {t("taste.onboardingSubtitle")}
        </Text>
      </View>

      <View style={styles.body}>
        {swipe.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.textSecondary} />
          </View>
        ) : swipe.hasError ? (
          <View style={styles.center}>
            <Text inline size="sm" color={theme.textSecondary} align="center">
              {t("taste.loadError")}
            </Text>
          </View>
        ) : swipe.total === 0 ? (
          <View style={styles.center}>
            <Text inline size="sm" color={theme.textSecondary} align="center">
              {t("taste.empty")}
            </Text>
          </View>
        ) : swipe.currentCard ? (
          <>
            <Text inline size="xs" weight="semibold" color={theme.textSecondary} align="center">
              {t("taste.progress", { current: swipe.progress, total: swipe.total }).toUpperCase()}
            </Text>
            <SwipeDeck
              key={swipe.currentCard.id}
              card={swipe.currentCard}
              nextCard={swipe.nextCard}
              onDecide={swipe.decide}
              disabled={swipe.submitting}
            />
          </>
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={theme.textSecondary} />
            <Text inline size="sm" color={theme.textSecondary} align="center">
              {t("taste.finishing")}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={showContinue ? t("taste.continue") : t("taste.skip")}
          variant={showContinue ? "solid" : "link"}
          width="fill"
          onPress={swipe.skipAll}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
  header: {
    gap: SPACING.XS,
  },
  body: {
    flex: 1,
    gap: SPACING.SM,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.SM,
  },
  footer: {
    paddingTop: SPACING.SM,
  },
});
