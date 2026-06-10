import { db } from "@seen/db";
import { reviews } from "@seen/db/schema";
import { and, eq, isNotNull, sql } from "@seen/db/orm";

import {
  MAX_NEIGHBORS,
  MIN_CO_RATED,
  MIN_MY_RATINGS,
  MIN_SIMILARITY,
  NEIGHBOR_POOL,
  neighborSimilarity,
  type Neighbor,
} from "../collaborative";

type NeighborRow = {
  user_id: string;
  co_rated: number;
  dot: number;
  norm_mine: number;
  norm_other: number;
  neighbor_mean: number;
};

// Users with the highest centered-rating overlap with the target, in one
// aggregate round-trip over `reviews`. Cold start: a user with fewer than
// MIN_MY_RATINGS ratings gets no neighbors (content + trending carry the feed).
export async function getNeighbors(userId: string): Promise<Neighbor[]> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), isNotNull(reviews.rating)));
  if (count < MIN_MY_RATINGS) return [];

  const result = await db.execute<NeighborRow>(sql`
    WITH means AS (
      SELECT user_id, AVG(rating)::float AS mu
      FROM reviews
      WHERE rating IS NOT NULL
      GROUP BY user_id
    ),
    mine AS (
      SELECT r.tmdb_id, r.media_type, (r.rating - m.mu) AS centered
      FROM reviews r
      JOIN means m ON m.user_id = r.user_id
      WHERE r.user_id = ${userId} AND r.rating IS NOT NULL
    )
    SELECT r.user_id,
           COUNT(*)::int                                    AS co_rated,
           SUM((r.rating - m.mu) * mine.centered)::float    AS dot,
           SUM(mine.centered * mine.centered)::float        AS norm_mine,
           SUM((r.rating - m.mu) * (r.rating - m.mu))::float AS norm_other,
           MAX(m.mu)::float                                 AS neighbor_mean
    FROM reviews r
    JOIN means m ON m.user_id = r.user_id
    JOIN mine ON mine.tmdb_id = r.tmdb_id AND mine.media_type = r.media_type
    WHERE r.user_id <> ${userId} AND r.rating IS NOT NULL
    GROUP BY r.user_id
    HAVING COUNT(*) >= ${MIN_CO_RATED}
    ORDER BY dot DESC
    LIMIT ${NEIGHBOR_POOL}
  `);

  return result.rows
    .map((row) => ({
      userId: row.user_id,
      similarity: neighborSimilarity({
        dot: row.dot,
        normMine: row.norm_mine,
        normOther: row.norm_other,
        coRated: row.co_rated,
      }),
      mean: row.neighbor_mean,
    }))
    .filter((neighbor) => neighbor.similarity > MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_NEIGHBORS);
}
