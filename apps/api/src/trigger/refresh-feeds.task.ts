import { schedules } from "@trigger.dev/sdk";
import { db } from "@seen/db";
import { sql } from "@seen/db/orm";

import { mapWithConcurrency } from "../lib/concurrency";
import { DEFAULT_REGION } from "../modules/tmdb/constants";
import { refreshUserFeed } from "../modules/recommendations/refresh-user-feed";

// Daily refresh of every active user's precomputed feed, after the 4am keyword
// backfill has settled. Computed inline (not fanned out per user) — at current
// scale one run is cheaper and simpler than hundreds of child runs.
const CONCURRENCY = 4;

type ActiveUserRow = { user_id: string; region: string | null };

export const refreshFeedsTask = schedules.task({
  id: "refresh-feeds",
  cron: "0 5 * * *",
  run: async () => {
    const result = await db.execute<ActiveUserRow>(sql`
      WITH active AS (
        SELECT user_id FROM reviews
        UNION SELECT user_id FROM likes
        UNION SELECT user_id FROM watchlist
        UNION SELECT user_id FROM not_interested
      )
      SELECT active.user_id,
             (SELECT region FROM user_platforms up
              WHERE up.user_id = active.user_id
              ORDER BY up.created_at DESC LIMIT 1) AS region
      FROM active
    `);

    let computed = 0;
    await mapWithConcurrency(result.rows, CONCURRENCY, async (row) => {
      try {
        await refreshUserFeed(row.user_id, row.region ?? DEFAULT_REGION);
        computed += 1;
      } catch (error) {
        console.error(`refresh-feeds: user ${row.user_id} failed`, error);
      }
    });

    return { users: result.rows.length, computed };
  },
});
