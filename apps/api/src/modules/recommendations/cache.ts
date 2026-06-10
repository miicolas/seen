import { redisGetJson, redisIncr, redisSetJson } from "../../lib/redis";
import type { FeedResponseDto } from "./model";

// Serving cache for the hydrated feed response, keyed by a per-user generation
// counter so storing a fresh batch (storeFeed) invalidates every cached
// (region, salt) variant in O(1) — no key scans. The default salt ("0", sent by
// clients that don't pull-to-refresh) keeps a long TTL; explicit refresh salts
// only need to absorb double-pulls.
const FEED_TTL_SECONDS = 6 * 3600;
const SALTED_FEED_TTL_SECONDS = 20 * 60;

export const DEFAULT_FEED_SALT = "0";

function generationKey(userId: string): string {
  return `rec:feed:gen:${userId}`;
}

async function feedGeneration(userId: string): Promise<number> {
  return (await redisGetJson<number>(generationKey(userId))) ?? 0;
}

export async function bumpFeedGeneration(userId: string): Promise<void> {
  await redisIncr(generationKey(userId));
}

function feedCacheKey(generation: number, userId: string, region: string, salt: string): string {
  return `rec:feed:v2:${generation}:${userId}:${region}:${salt}`;
}

export async function getCachedFeed(
  userId: string,
  region: string,
  salt: string,
): Promise<FeedResponseDto | null> {
  const generation = await feedGeneration(userId);
  return redisGetJson<FeedResponseDto>(feedCacheKey(generation, userId, region, salt));
}

export async function setCachedFeed(
  userId: string,
  region: string,
  salt: string,
  feed: FeedResponseDto,
): Promise<void> {
  const generation = await feedGeneration(userId);
  const ttl = salt === DEFAULT_FEED_SALT ? FEED_TTL_SECONDS : SALTED_FEED_TTL_SECONDS;
  await redisSetJson(feedCacheKey(generation, userId, region, salt), feed, ttl);
}
