import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button/button";
import { GlassButton } from "@/components/ui/button/glass-button";
import { Text } from "@/components/ui/text";
import { ALWAYS_DARK_COLORS } from "@/constants/always-dark";
import { SPACING } from "@/constants/design-tokens";

import { ProgressPill } from "./progress-pill";
import { SwipeBackground } from "./swipe-background";
import { SwipeDeck } from "./swipe-deck";
import { useTasteSwipe } from "./use-taste-swipe";

export function TasteSwipe() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const swipe = useTasteSwipe();

  const showContinue = !swipe.isLoading && (swipe.hasError || swipe.total === 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SwipeBackground posterPath={swipe.currentCard?.poster_path ?? null} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + SPACING.LG,
            paddingBottom: insets.bottom + SPACING.MD,
          },
        ]}>
        <View style={styles.header}>
          <Text size="5xl" weight="semibold" color={ALWAYS_DARK_COLORS.text}>
            {t("taste.onboardingTitle")}
          </Text>
          <Text inline size="md" weight="regular" color={ALWAYS_DARK_COLORS.textMuted}>
            {t("taste.onboardingSubtitle")}
          </Text>
        </View>

        <View style={styles.body}>
          {swipe.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={ALWAYS_DARK_COLORS.textMuted} />
            </View>
          ) : swipe.hasError ? (
            <View style={styles.center}>
              <Text inline size="sm" color={ALWAYS_DARK_COLORS.textMuted} align="center">
                {t("taste.loadError")}
              </Text>
            </View>
          ) : swipe.total === 0 ? (
            <View style={styles.center}>
              <Text inline size="sm" color={ALWAYS_DARK_COLORS.textMuted} align="center">
                {t("taste.empty")}
              </Text>
            </View>
          ) : swipe.currentCard ? (
            <>
              <ProgressPill
                label={t("taste.progress", {
                  current: swipe.progress,
                  total: swipe.total,
                }).toUpperCase()}
              />
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
              <ActivityIndicator color={ALWAYS_DARK_COLORS.textMuted} />
              <Text inline size="sm" color={ALWAYS_DARK_COLORS.textMuted} align="center">
                {t("taste.finishing")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {showContinue ? (
            <GlassButton title={t("taste.continue")} width="fill" onPress={swipe.skipAll} />
          ) : (
            <Button
              title={t("taste.skip")}
              variant="link"
              tintColor={ALWAYS_DARK_COLORS.text}
              width="fill"
              onPress={swipe.skipAll}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ALWAYS_DARK_COLORS.surface,
  },
  // Above the background's internal zIndex layers, like the pre-auth onboarding screen.
  content: {
    flex: 1,
    zIndex: 10,
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
