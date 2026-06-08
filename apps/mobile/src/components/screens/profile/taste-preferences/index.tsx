import { Form, Host, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { MOODS, MOVIE_GENRES_LIST } from "@seen/shared";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useMyPreferences } from "@/hooks/preferences/use-my-preferences";
import { useSetPreferences } from "@/hooks/preferences/use-set-preferences";
import { useAccentColor } from "@/hooks/use-accent-color";
import { hapticTap } from "@/lib/haptics";

import { SelectableSection, type SelectableItem } from "./selectable-section";
import { usePreferenceDraft } from "./use-preference-draft";

const GENRE_ITEMS: SelectableItem<number>[] = MOVIE_GENRES_LIST.map((genre) => ({
  value: genre.id,
  label: genre.name,
}));
const MOOD_ITEMS: SelectableItem<string>[] = MOODS.map((mood) => ({ value: mood, label: mood }));

export function TastePreferences() {
  const { t } = useTranslation();
  const router = useRouter();
  const { accentHex } = useAccentColor();

  const { data } = useMyPreferences();
  const setMutation = useSetPreferences();
  const draft = usePreferenceDraft(data);

  async function save() {
    if (setMutation.isPending) return;
    hapticTap();
    try {
      await setMutation.mutateAsync(draft.input);
      router.back();
    } catch {
      // hapticError fires in the mutation; stay on screen so the user can retry.
    }
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          variant="prominent"
          tintColor={accentHex}
          onPress={save}>
          {setMutation.isPending ? t("taste.saving") : t("taste.save")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <Host
        matchContents={false}
        ignoreSafeArea="keyboard"
        useViewportSizeMeasurement
        style={{ flex: 1 }}>
        <Form modifiers={[tint(accentHex)]}>
          <SelectableSection
            title={t("taste.favoriteGenres")}
            items={GENRE_ITEMS}
            selected={draft.favorite}
            onToggle={draft.toggleFavorite}
          />

          <SelectableSection
            title={t("taste.dislikedGenres")}
            items={GENRE_ITEMS}
            selected={draft.disliked}
            onToggle={draft.toggleDisliked}
          />

          <SelectableSection
            title={t("taste.moods")}
            items={MOOD_ITEMS}
            selected={draft.moods}
            onToggle={draft.toggleMood}
            footer={<SwiftUIText>{t("taste.settingsSubtitle")}</SwiftUIText>}
          />
        </Form>
      </Host>
    </>
  );
}
