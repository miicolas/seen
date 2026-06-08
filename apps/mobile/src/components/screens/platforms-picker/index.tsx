import { Button, Form, Host, Label, Section, Toggle } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useMyPlatforms } from "@/hooks/platforms/use-my-platforms";
import { useProviders } from "@/hooks/platforms/use-providers";
import { useSetMyPlatforms } from "@/hooks/platforms/use-set-my-platforms";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection, hapticTap } from "@/lib/haptics";
import { getRegion } from "@/lib/region";
import { useOnboardingStore } from "@/store/use-onboarding-store";

type Props = {
  mode: "onboarding" | "settings";
};

export function PlatformsPicker({ mode }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accentHex } = useAccentColor();

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

  return (
    <Host style={{ flex: 1 }}>
      <Form modifiers={[tint(accentHex)]}>
        <Section title={headerTitle}>
          <Label systemImage="tv" title={subtitle} color={theme.textSecondary} />
        </Section>

        <Section
          title={t("platforms.selectedCount", {
            count: selected.size,
            plural: selected.size === 1 ? "" : "s",
          })}>
          {providers.data.length === 0 ? (
            <Label
              systemImage="tray"
              title={providers.isLoading ? "…" : t("platforms.empty")}
              color={theme.textSecondary}
            />
          ) : (
            providers.data.map((provider) => (
              <Toggle
                key={provider.providerId}
                label={provider.name}
                isOn={selected.has(provider.providerId)}
                onIsOnChange={() => toggle(provider.providerId)}
              />
            ))
          )}
        </Section>

        {errorMessage ? (
          <Section>
            <Label
              systemImage="exclamationmark.triangle"
              title={errorMessage}
              color={theme.error}
            />
          </Section>
        ) : null}

        <Section>
          <Button label={primaryLabel} onPress={() => save({ skipped: false })} />
          {mode === "onboarding" ? (
            <Button
              label={t("platforms.skip")}
              onPress={() => save({ skipped: true })}
              modifiers={[tint(theme.textSecondary)]}
            />
          ) : null}
        </Section>
      </Form>
    </Host>
  );
}
