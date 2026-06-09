import { db } from "@seen/db";
import { interactionEvents, recommendationEvents } from "@seen/db/schema";
import { and, eq, gte, lt } from "@seen/db/orm";

import type { RecommendationSource } from "../../events/shared";
import type { DiscoveryImpression, DiscoveryInteraction, Period } from "../shared";

const ATTRIBUTION_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

export async function fetchDiscoveryEvents(
  userId: string,
  period: Period,
): Promise<{ impressions: DiscoveryImpression[]; interactions: DiscoveryInteraction[] }> {
  const from = new Date(period.from);
  const to = new Date(period.to);
  const lookback = new Date(from.getTime() - ATTRIBUTION_LOOKBACK_MS);

  const [impressionRows, interactionRows] = await Promise.all([
    db
      .select({
        tmdbId: recommendationEvents.tmdbId,
        mediaType: recommendationEvents.mediaType,
        source: recommendationEvents.source,
        shownAt: recommendationEvents.shownAt,
        clicked: recommendationEvents.clicked,
        addedToWatchlist: recommendationEvents.addedToWatchlist,
        markedWatched: recommendationEvents.markedWatched,
        rated: recommendationEvents.rated,
        shared: recommendationEvents.shared,
        dismissed: recommendationEvents.dismissed,
      })
      .from(recommendationEvents)
      .where(
        and(
          eq(recommendationEvents.userId, userId),
          gte(recommendationEvents.shownAt, lookback),
          lt(recommendationEvents.shownAt, to),
        ),
      ),
    db
      .select({
        tmdbId: interactionEvents.tmdbId,
        mediaType: interactionEvents.mediaType,
        type: interactionEvents.type,
        createdAt: interactionEvents.createdAt,
      })
      .from(interactionEvents)
      .where(
        and(
          eq(interactionEvents.userId, userId),
          gte(interactionEvents.createdAt, from),
          lt(interactionEvents.createdAt, to),
        ),
      ),
  ]);

  const fromMs = from.getTime();
  const impressions: DiscoveryImpression[] = impressionRows.map((row) => ({
    tmdbId: row.tmdbId,
    mediaType: row.mediaType === "tv" ? "tv" : "movie",
    source: row.source as RecommendationSource,
    shownAt: row.shownAt,
    inRange: row.shownAt.getTime() >= fromMs,
    flags: {
      clicked: row.clicked,
      addedToWatchlist: row.addedToWatchlist,
      markedWatched: row.markedWatched,
      rated: row.rated,
      shared: row.shared,
      dismissed: row.dismissed,
    },
  }));

  const interactions: DiscoveryInteraction[] = interactionRows
    .filter((row) => row.tmdbId != null)
    .map((row) => ({
      tmdbId: row.tmdbId as number,
      mediaType: row.mediaType === "movie" || row.mediaType === "tv" ? row.mediaType : null,
      type: row.type,
      createdAt: row.createdAt,
    }));

  return { impressions, interactions };
}
