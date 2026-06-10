import { redisDel, redisGetJson, redisSetJson } from "../../lib/redis";
import type { FeedResponseDto } from "./model";

// Serving cache for the hydrated feed response. Invalidated whenever a fresh
// batch is stored (storeFeed), so a pull-to-refresh after a signal change sees
// the recomputed feed. v1 doubles as a payload-shape escape hatch.
const FEED_TTL_SECONDS = 6 * 3600;

function feedCacheKey(userId: string, region: string): string {
  return `rec:feed:v1:${userId}:${region}`;
}

export function getCachedFeed(userId: string, region: string): Promise<FeedResponseDto | null> {
  return redisGetJson<FeedResponseDto>(feedCacheKey(userId, region));
}

export async function setCachedFeed(
  userId: string,
  region: string,
  feed: FeedResponseDto,
): Promise<void> {
  await redisSetJson(feedCacheKey(userId, region), feed, FEED_TTL_SECONDS);
}

export async function invalidateCachedFeed(userId: string, region: string): Promise<void> {
  await redisDel(feedCacheKey(userId, region));
}
