import { asMediaType } from "@seen/shared";
import { db } from "@seen/db";
import { mediaFeatures, movies as moviesTable } from "@seen/db/schema";
import { and, eq, isNull, ne, or, sql } from "@seen/db/orm";

import { mapWithConcurrency } from "../lib/concurrency";
import { ENCODER_VERSION } from "../modules/similarity/encoder";
import { rebuildMediaFeature, rebuildUserTaste } from "../modules/similarity/mutations";
import { refreshUserFeed } from "../modules/recommendations/refresh-user-feed";
import { trending } from "../modules/tmdb/summaries";

// One-off bootstrap for a database that predates the recommendation engine:
// warm trending into the movies cache, build every missing feature vector,
// rebuild every user's taste vector, then precompute every active user's feed.
// Safe to re-run (everything upserts). Run from the repo:
//   DATABASE_URL=<url> TMDB_TOKEN=<token> bun apps/api/src/scripts/backfill-media-features.ts
const CONCURRENCY = 4;

console.log("warming trending lists…");
await Promise.all([trending("all", "week"), trending("movie", "week"), trending("tv", "week")]);

const missing = await db
  .select({ tmdbId: moviesTable.tmdbId, mediaType: moviesTable.mediaType })
  .from(moviesTable)
  .leftJoin(
    mediaFeatures,
    and(
      eq(mediaFeatures.tmdbId, moviesTable.tmdbId),
      eq(mediaFeatures.mediaType, moviesTable.mediaType),
    ),
  )
  .where(or(isNull(mediaFeatures.tmdbId), ne(mediaFeatures.encoderVersion, ENCODER_VERSION)));

console.log(`building ${missing.length} media feature vectors…`);
let built = 0;
await mapWithConcurrency(missing, CONCURRENCY, async (row) => {
  try {
    const embedding = await rebuildMediaFeature(row.tmdbId, asMediaType(row.mediaType));
    if (embedding) built += 1;
  } catch (error) {
    console.error(`media feature ${row.mediaType}:${row.tmdbId} failed`, error);
  }
});
console.log(`built ${built}/${missing.length}`);

const activeUsers = await db.execute<{ user_id: string }>(sql`
  SELECT user_id FROM reviews
  UNION SELECT user_id FROM likes
  UNION SELECT user_id FROM watchlist
  UNION SELECT user_id FROM not_interested
`);

console.log(`rebuilding taste vectors + feeds for ${activeUsers.rows.length} users…`);
let feeds = 0;
await mapWithConcurrency(activeUsers.rows, CONCURRENCY, async (row) => {
  try {
    await rebuildUserTaste(row.user_id);
    const entries = await refreshUserFeed(row.user_id);
    feeds += 1;
    console.log(`  ${row.user_id}: ${entries} feed entries`);
  } catch (error) {
    console.error(`user ${row.user_id} failed`, error);
  }
});

console.log(`done: ${feeds}/${activeUsers.rows.length} feeds computed`);
process.exit(0);
