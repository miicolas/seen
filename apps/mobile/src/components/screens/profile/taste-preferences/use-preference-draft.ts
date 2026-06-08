import { useMemo, useState } from "react";

import { removeFromSet, toggleInSet } from "@/lib/set";
import type { Preferences, PreferencesInput } from "@/services/preferences";

type PreferenceDraft = {
  favorite: Set<number>;
  disliked: Set<number>;
  moods: Set<string>;
};

function toDraft(preferences?: Preferences | null): PreferenceDraft {
  return {
    favorite: new Set(preferences?.favorite_genres ?? []),
    disliked: new Set(preferences?.disliked_genres ?? []),
    moods: new Set(preferences?.moods ?? []),
  };
}

export function usePreferenceDraft(preferences: Preferences | null) {
  const [draft, setDraft] = useState<PreferenceDraft>(() => toDraft());
  const [applied, setApplied] = useState<Preferences | null>(null);

  // Seed local selections from the server once it loads (render-phase sync, the
  // same pattern the platforms picker uses).
  if (preferences && preferences !== applied) {
    setApplied(preferences);
    setDraft(toDraft(preferences));
  }

  const input = useMemo<PreferencesInput>(
    () => ({
      favorite_genres: [...draft.favorite],
      disliked_genres: [...draft.disliked],
      moods: [...draft.moods],
    }),
    [draft.favorite, draft.disliked, draft.moods],
  );

  function toggleFavorite(id: number) {
    setDraft((prev) => ({
      ...prev,
      favorite: toggleInSet(prev.favorite, id),
      disliked: removeFromSet(prev.disliked, id),
    }));
  }

  function toggleDisliked(id: number) {
    setDraft((prev) => ({
      ...prev,
      disliked: toggleInSet(prev.disliked, id),
      favorite: removeFromSet(prev.favorite, id),
    }));
  }

  function toggleMood(mood: string) {
    setDraft((prev) => ({ ...prev, moods: toggleInSet(prev.moods, mood) }));
  }

  return {
    favorite: draft.favorite,
    disliked: draft.disliked,
    moods: draft.moods,
    input,
    toggleFavorite,
    toggleDisliked,
    toggleMood,
  };
}
