import { db } from "@seen/db";
import { interactionEvents } from "@seen/db/schema";

import type { InteractionEventInput } from "../shared";

export async function recordInteractions(userId: string, events: InteractionEventInput[]) {
  if (events.length === 0) return { inserted: 0 };

  const rows = events.map((event) => ({
    userId,
    tmdbId: event.tmdb_id ?? null,
    mediaType: event.media_type ?? null,
    type: event.type,
    metadata: event.metadata ?? null,
  }));

  await db.insert(interactionEvents).values(rows);

  return { inserted: rows.length };
}
