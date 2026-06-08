import { db } from "@seen/db";
import { recommendationEvents } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import type { OutcomeInput } from "../shared";
import { toRecommendationEvent } from "../shared";

export async function applyOutcome(userId: string, input: OutcomeInput) {
  const patch: Partial<typeof recommendationEvents.$inferInsert> = {};
  if (input.clicked !== undefined) patch.clicked = input.clicked;
  if (input.added_to_watchlist !== undefined) patch.addedToWatchlist = input.added_to_watchlist;
  if (input.marked_watched !== undefined) patch.markedWatched = input.marked_watched;
  if (input.rated !== undefined) patch.rated = input.rated;
  if (input.shared !== undefined) patch.shared = input.shared;
  if (input.dismissed !== undefined) patch.dismissed = input.dismissed;
  if (input.time_spent_ms !== undefined) patch.timeSpentMs = input.time_spent_ms;

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "No outcome fields provided.");
  }

  const [updated] = await db
    .update(recommendationEvents)
    .set(patch)
    .where(and(eq(recommendationEvents.id, input.id), eq(recommendationEvents.userId, userId)))
    .returning();

  if (!updated) {
    throw new HttpError(404, "Recommendation event not found.");
  }

  return toRecommendationEvent(updated);
}
