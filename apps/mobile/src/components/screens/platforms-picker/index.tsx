import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button/button";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useMyPlatforms } from "@/hooks/platforms/use-my-platforms";
import { useProviders } from "@/hooks/platforms/use-providers";
import { useSetMyPlatforms } from "@/hooks/platforms/use-set-my-platforms";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection, hapticTap } from "@/lib/haptics";
import { getRegion } from "@/lib/region";
import { useOnboardingStore } from "@/store/use-onboarding-store";

import { ProviderRow } from "./provider-row";

type Props = {
  mode: "onboarding" | "settings";
};

export function PlatformsPicker({ mode }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const region = getRegion();
  const providers = useProviders(region);
  const myPlatforms = useMyPlatforms(region);
  const setMutation = useSetMyPlatforms();

  const completeOnboarding = useOnboardingStore((state) => state.completeOnboardingAction);
  const markPlatformsSkipped = useOnboardingStore((state) => state.markPlatformsSkippedAction);
  const markPlatformsCompleted = useOnboardingStore((state) => state.markPlatformsCompletedAction);

  const initialIds = useMemo(
    () => new Set(myPlatforms.data?.providers.map((provider) => provider.providerId) ?? []),
    [myPlatforms.data],
  );

  const [selected, setSelected] = useState<Set<number>>(initialIds);
  const [seenInitial, setSeenInitial] = useState(initialIds);
  if (seenInitial !== initialIds) {
    setSeenInitial(initialIds);
    setSelected(initialIds);
  }

  const errorMessage = setMutation.error ? t("platforms.saveError") : (providers.error ?? null);

  function toggle(providerId: number) {
    hapticSelection();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  }

  async function save({ skipped }: { skipped: boolean }) {
    hapticTap();
    try {
      await setMutation.mutateAsync({
        region,
        providerIds: skipped ? [] : Array.from(selected),
      });
      if (mode === "onboarding") {
        if (skipped) markPlatformsSkipped();
        else markPlatformsCompleted();
        completeOnboarding();
      } else {
        router.back();
      }
    } catch {
      // hapticError fires inside the mutation; surface the message via errorMessage
    }
  }

  const subtitle =
    mode === "onboarding" ? t("platforms.onboardingSubtitle") : t("platforms.subtitle");
  const headerTitle = mode === "onboarding" ? t("platforms.onboardingTitle") : t("platforms.title");
  const primaryLabel = setMutation.isPending
    ? t("platforms.saving")
    : mode === "onboarding"
      ? t("platforms.onboardingContinue")
      : t("platforms.save");

  const isOnboarding = mode === "onboarding";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior={isOnboarding ? "never" : "automatic"}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: isOnboarding ? insets.top + SPACING.LG : SPACING.MD,
            paddingBottom: insets.bottom + SPACING.LG,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {isOnboarding ? (
          <View style={styles.header}>
            <Text size="3xl" weight="bold" color={theme.text}>
              {headerTitle}
            </Text>
            <Text inline size="md" weight="regular" color={theme.textSecondary}>
              {subtitle}
            </Text>
          </View>
        ) : (
          <Text inline size="md" weight="regular" color={theme.textSecondary}>
            {subtitle}
          </Text>
        )}

        <Text inline size="xs" weight="semibold" color={theme.textSecondary}>
          {t("platforms.selectedCount", {
            count: selected.size,
            plural: selected.size === 1 ? "" : "s",
          }).toUpperCase()}
        </Text>

        {providers.data.length === 0 ? (
          <View style={styles.empty}>
            <SymbolView name="tray" size={28} tintColor={theme.textSecondary} />
            <Text inline size="sm" color={theme.textSecondary} align="center">
              {providers.isLoading ? "…" : t("platforms.empty")}
            </Text>
          </View>
        ) : (
          <View style={[styles.list, { backgroundColor: theme.backgroundElement }]}>
            {providers.data.map((provider, index) => (
              <Fragment key={provider.providerId}>
                {index > 0 ? (
                  <View style={[styles.separator, { backgroundColor: theme.background }]} />
                ) : null}
                <ProviderRow
                  name={provider.name}
                  logoPath={provider.logoPath}
                  selected={selected.has(provider.providerId)}
                  onToggle={() => toggle(provider.providerId)}
                />
              </Fragment>
            ))}
          </View>
        )}

        {errorMessage ? (
          <View style={styles.error}>
            <SymbolView name="exclamationmark.triangle" size={16} tintColor={theme.error} />
            <Text inline size="sm" color={theme.error}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button title={primaryLabel} width="fill" onPress={() => save({ skipped: false })} />
          {mode === "onboarding" ? (
            <Button
              title={t("platforms.skip")}
              variant="link"
              width="fill"
              onPress={() => save({ skipped: true })}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
  header: {
    gap: SPACING.XS,
  },
  list: {
    borderRadius: BORDER_RADIUS.MD,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.MD + 40 + SPACING.MD,
  },
  empty: {
    alignItems: "center",
    gap: SPACING.SM,
    paddingVertical: SPACING.XL,
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.XS,
  },
  actions: {
    gap: SPACING.XS,
    paddingTop: SPACING.SM,
  },
});
