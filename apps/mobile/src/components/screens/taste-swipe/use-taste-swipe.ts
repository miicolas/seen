import { preferenceKeys } from "@seen/shared";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { hapticSuccess } from "@/lib/haptics";
import {
  getOnboardingNext,
  getOnboardingSeed,
  recordOnboardingSwipes,
  type OnboardingNextRequest,
  type OnboardingSwipe,
  type SeedItem,
} from "@/services/preferences";
import { useOnboardingStore } from "@/store/use-onboarding-store";

import { cardKey, mergeAdaptiveCards } from "./deck-queue";

// Importers get a shortened deck; everyone else the full set.
const FULL_COUNT = 18;
const SHORT_COUNT = 8;
// The deck opens with pure diverse probes; once decisions accumulate, adaptive
// batches (recommendations seeded by the likes so far) are prefetched in the
// background and spliced in behind the card on screen — never a blocking fetch.
const INITIAL_QUEUE = 4;
const PREFETCH_COUNT = 3;
const MIN_BUFFER = 3;
const KEEP_AHEAD = 1;
const ADAPTIVE_AFTER = 2;

export type SwipeChoice = "like" | "dislike" | "skip";

type ExcludeRef = OnboardingNextRequest["exclude"][number];

// Upcoming cards: queue feeds the screen, reserve holds the unshown probes.
type Deck = { queue: SeedItem[]; reserve: SeedItem[] };

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

  const submitMutation = useMutation({
    mutationFn: (items: OnboardingSwipe[]) => recordOnboardingSwipes(items),
  });

  // The deck derives from the seed until the first swipe overrides it.
  const seedDeck = useMemo<Deck>(() => {
    const seed = (seedQuery.data ?? []).slice(0, limit);
    return { queue: seed.slice(0, INITIAL_QUEUE), reserve: seed.slice(INITIAL_QUEUE) };
  }, [seedQuery.data, limit]);

  const [deckOverride, setDeckOverride] = useState<Deck | null>(null);
  const [served, setServed] = useState(0);
  const [decisions, setDecisions] = useState<OnboardingSwipe[]>([]);
  const shownKeys = useRef(new Set<string>());
  const shownRefs = useRef<ExcludeRef[]>([]);
  const servedRef = useRef(0);
  const inFlight = useRef(false);

  const deck = deckOverride ?? seedDeck;
  const total = Math.min(limit, served + deck.queue.length + deck.reserve.length);
  const currentCard = deck.queue[0] ?? null;
  const nextCard = deck.queue[1] ?? null;

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

  function prefetchAdaptive(swipes: OnboardingSwipe[], upcoming: SeedItem[]) {
    inFlight.current = true;
    const exclude: ExcludeRef[] = [
      ...shownRefs.current,
      ...upcoming.map((card) => ({ tmdb_id: card.id, media_type: card.media_type })),
    ];
    getOnboardingNext({ swipes, exclude, count: PREFETCH_COUNT })
      .then((fresh) => {
        if (fresh.length === 0) return;
        const freshKeys = new Set(fresh.map(cardKey));
        setDeckOverride((current) => {
          const base = current ?? seedDeck;
          return {
            queue: mergeAdaptiveCards({
              queue: base.queue,
              fresh,
              keepAhead: KEEP_AHEAD,
              capacity: Math.max(KEEP_AHEAD, limit - servedRef.current),
              excludeKeys: new Set([...shownKeys.current, ...base.queue.map(cardKey)]),
            }),
            // A returned probe now lives in the queue — drop it from the reserve.
            reserve: base.reserve.filter((card) => !freshKeys.has(cardKey(card))),
          };
        });
      })
      .catch(() => {
        // The probe reserve keeps the deck flowing; the next swipe retries.
      })
      .finally(() => {
        inFlight.current = false;
      });
  }

  function decide(choice: SwipeChoice) {
    if (!currentCard) return;
    const nextDecisions =
      choice === "skip"
        ? decisions
        : [...decisions, { tmdb_id: currentCard.id, media_type: currentCard.media_type, choice }];
    setDecisions(nextDecisions);

    shownKeys.current.add(cardKey(currentCard));
    shownRefs.current.push({ tmdb_id: currentCard.id, media_type: currentCard.media_type });

    const nextServed = served + 1;
    servedRef.current = nextServed;
    setServed(nextServed);

    // Synchronous top-up from the probe reserve so the next card is always ready.
    let nextQueue = deck.queue.slice(1);
    let nextReserve = deck.reserve;
    const room = Math.max(0, limit - nextServed - nextQueue.length);
    if (nextQueue.length < MIN_BUFFER && nextReserve.length > 0 && room > 0) {
      const take = Math.min(MIN_BUFFER - nextQueue.length, nextReserve.length, room);
      nextQueue = [...nextQueue, ...nextReserve.slice(0, take)];
      nextReserve = nextReserve.slice(take);
    }
    setDeckOverride({ queue: nextQueue, reserve: nextReserve });

    if (nextServed >= limit || nextQueue.length === 0) {
      void finish(nextDecisions);
      return;
    }

    if (
      choice !== "skip" &&
      nextDecisions.length >= ADAPTIVE_AFTER &&
      !inFlight.current &&
      nextServed + KEEP_AHEAD < limit
    ) {
      prefetchAdaptive(nextDecisions, nextQueue);
    }
  }

  // Whole-step skip — record nothing, move on.
  function skipAll() {
    markTasteSkipped();
    router.replace("/platforms");
  }

  return {
    currentCard,
    nextCard,
    total,
    progress: Math.min(served + 1, total),
    isLoading: seedQuery.isLoading,
    hasError: Boolean(seedQuery.error),
    submitting: submitMutation.isPending,
    decide,
    skipAll,
  };
}
