import { preferenceKeys } from "@seen/shared";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { hapticSuccess } from "@/lib/haptics";
import {
  getOnboardingSeed,
  recordOnboardingSwipes,
  type OnboardingSwipe,
  type SeedItem,
} from "@/services/preferences";
import { useOnboardingStore } from "@/store/use-onboarding-store";

// Importers get a shortened deck; everyone else the full set.
const FULL_COUNT = 18;
const SHORT_COUNT = 8;

export type SwipeChoice = "like" | "dislike" | "skip";

export function useTasteSwipe() {
  const router = useRouter();
  const importStatus = useOnboardingStore((state) => state.letterboxdImportStatus);
  const markTasteCompleted = useOnboardingStore((state) => state.markTasteCompletedAction);
  const markTasteSkipped = useOnboardingStore((state) => state.markTasteSkippedAction);

  const limit = importStatus === "completed" ? SHORT_COUNT : FULL_COUNT;

  const seedQuery = useQuery({
    queryKey: preferenceKeys.onboardingSeed(),
    queryFn: () => getOnboardingSeed(),
  });

  const cards = useMemo<SeedItem[]>(
    () => (seedQuery.data ?? []).slice(0, limit),
    [seedQuery.data, limit],
  );

  const submitMutation = useMutation({
    mutationFn: (items: OnboardingSwipe[]) => recordOnboardingSwipes(items),
  });

  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<OnboardingSwipe[]>([]);

  const total = cards.length;
  const currentCard = index < total ? cards[index] : null;
  const nextCard = index + 1 < total ? cards[index + 1] : null;

  async function finish(finalDecisions: OnboardingSwipe[]) {
    try {
      if (finalDecisions.length > 0) await submitMutation.mutateAsync(finalDecisions);
    } catch {
      // Best-effort — never block onboarding on a failed signal write.
    }
    markTasteCompleted();
    hapticSuccess();
    router.replace("/platforms");
  }

  function decide(choice: SwipeChoice) {
    if (!currentCard) return;
    const next =
      choice === "skip"
        ? decisions
        : [...decisions, { tmdb_id: currentCard.id, media_type: currentCard.media_type, choice }];
    setDecisions(next);

    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (nextIndex >= total) void finish(next);
  }

  // Whole-step skip — record nothing, move on.
  function skipAll() {
    markTasteSkipped();
    router.replace("/platforms");
  }

  return {
    cards,
    currentCard,
    nextCard,
    total,
    progress: Math.min(index + 1, total),
    isLoading: seedQuery.isLoading,
    hasError: Boolean(seedQuery.error),
    submitting: submitMutation.isPending,
    refetch: seedQuery.refetch,
    decide,
    skipAll,
  };
}
