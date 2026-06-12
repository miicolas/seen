import { db } from "@seen/db";
import { likes, notInterested, watchlist } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";

type MediaRef = {
  tmdb_id: number;
  media_type: MediaType;
};

function toMediaRef(row: { tmdbId: number; mediaType: string }): MediaRef {
  return { tmdb_id: row.tmdbId, media_type: row.mediaType as MediaType };
}

// One round trip for everything the client needs to mark posters as
// watchlisted/liked/dismissed — identifier pairs only, no media enrichment.
export async function getMemberships(userId: string) {
  const [watchlistRows, likeRows, notInterestedRows] = await Promise.all([
    db
      .select({ tmdbId: watchlist.tmdbId, mediaType: watchlist.mediaType })
      .from(watchlist)
      .where(eq(watchlist.userId, userId)),
    db
      .select({ tmdbId: likes.tmdbId, mediaType: likes.mediaType, kind: likes.kind })
      .from(likes)
      .where(eq(likes.userId, userId)),
    db
      .select({ tmdbId: notInterested.tmdbId, mediaType: notInterested.mediaType })
      .from(notInterested)
      .where(eq(notInterested.userId, userId)),
  ]);

  return {
    watchlist: watchlistRows.map(toMediaRef),
    likes: likeRows.filter((row) => row.kind === "like").map(toMediaRef),
    favorites: likeRows.filter((row) => row.kind === "favorite").map(toMediaRef),
    not_interested: notInterestedRows.map(toMediaRef),
  };
}
