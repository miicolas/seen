import { db } from "@seen/db";
import { userPlatforms } from "@seen/db/schema";
import { desc, eq } from "@seen/db/orm";

import { DEFAULT_REGION } from "../tmdb/constants";
import { computeUserFeed } from "./queries/compute-feed";
import { storeFeed } from "./mutations/store-feed";

async function getUserRegion(userId: string): Promise<string> {
  const [row] = await db
    .select({ region: userPlatforms.region })
    .from(userPlatforms)
    .where(eq(userPlatforms.userId, userId))
    .orderBy(desc(userPlatforms.createdAt))
    .limit(1);
  return row?.region ?? DEFAULT_REGION;
}

// Recompute and persist one user's feed, resolving their region from their
// streaming platforms when the caller doesn't know it (signal-change enqueues).
export async function refreshUserFeed(userId: string, region?: string): Promise<number> {
  const resolved = region ?? (await getUserRegion(userId));
  const computed = await computeUserFeed(userId, resolved);
  await storeFeed(userId, resolved, computed);
  return computed.entries.length;
}
