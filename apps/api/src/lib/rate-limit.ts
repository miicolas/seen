import { HttpError } from "./http-error";
import { redis } from "./redis";

type RateLimitOptions = {
  key: string;
  max: number;
  windowSeconds: number;
  message: string;
  code: string;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();

function assertMemoryRateLimit({ key, max, windowSeconds, message, code }: RateLimitOptions) {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowSeconds * 1000 };

  bucket.count += 1;
  memoryBuckets.set(key, bucket);

  if (bucket.count > max) {
    throw new HttpError(429, message, code);
  }
}

export async function assertRateLimit(options: RateLimitOptions): Promise<void> {
  if (!redis) {
    assertMemoryRateLimit(options);
    return;
  }

  const key = `rate:${options.key}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, options.windowSeconds);
    if (count > options.max) {
      throw new HttpError(429, options.message, options.code);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    assertMemoryRateLimit(options);
  }
}
