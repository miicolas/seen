import { recordInteractions } from "../../events/mutations";
import type { InteractionEventInput } from "../../events/shared";
import { addLike } from "../../likes/mutations";
import { dismiss } from "../../not-interested/mutations";
import { enqueueSimilarityRefresh } from "../../similarity";
import type { MediaType } from "../../tmdb";

export type OnboardingSwipe = {
  tmdb_id: number;
  media_type: MediaType;
  choice: "like" | "dislike";
};

// Collapses repeated swipes on the same title (last choice wins) so counts and
// interaction_events aren't double-written when the client sends duplicates.
function dedupeSwipes(items: OnboardingSwipe[]): OnboardingSwipe[] {
  const byKey = new Map<string, OnboardingSwipe>();
  for (const item of items) byKey.set(`${item.media_type}:${item.tmdb_id}`, item);
  return [...byKey.values()];
}

// One write path for an onboarding swipe batch: likes → likes table, dislikes →
// not-interested (reason "onboarding"), and every choice → interaction_events
// (source "onboarding") so #12 can weight it. Skips never reach here.
//
// Per-item writes run concurrently and a single failed title (e.g. a TMDB
// lookup error) is skipped rather than aborting the batch — so one bad id can't
// leave likes/dismisses persisted with their interaction_events dropped. Each
// event is emitted only for a write that succeeded, keeping the two consistent.
export async function recordOnboardingSwipes(userId: string, items: OnboardingSwipe[]) {
  const results = await Promise.all(
    dedupeSwipes(items).map(async (item): Promise<InteractionEventInput | null> => {
      const ref = { tmdb_id: item.tmdb_id, media_type: item.media_type };
      try {
        if (item.choice === "like") {
          // Per-item media-feature refresh still fires inside addLike; the taste
          // rebuild is deferred to one call after the whole batch.
          await addLike(userId, { ...ref, kind: "like" }, { skipTasteRefresh: true });
          return { type: "liked", ...ref, metadata: { source: "onboarding" } };
        }
        await dismiss(userId, { ...ref, reason: "onboarding" }, { skipTasteRefresh: true });
        return { type: "not_interested", ...ref, metadata: { source: "onboarding" } };
      } catch (error) {
        console.error(`onboarding swipe skipped for ${item.media_type}:${item.tmdb_id}`, error);
        return null;
      }
    }),
  );

  const events = results.filter((event): event is InteractionEventInput => event !== null);
  await recordInteractions(userId, events);

  // One taste rebuild for the whole onboarding batch rather than one per swipe.
  if (events.length > 0) enqueueSimilarityRefresh(userId);

  return {
    liked: events.filter((event) => event.type === "liked").length,
    disliked: events.filter((event) => event.type === "not_interested").length,
  };
}
