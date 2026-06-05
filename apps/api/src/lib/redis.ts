import Redis from "ioredis";

import { env } from "../env";

export const redis = env.redisUrl
  ? new Redis(env.redisUrl, {
      connectTimeout: 500,
      commandTimeout: 500,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })
  : null;

async function safeRedis<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  if (!redis) return fallback;
  try {
    return await operation();
  } catch {
    return fallback;
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const value = await safeRedis(() => redis!.get(key), null);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await safeRedis(
    () => redis!.set(key, JSON.stringify(value), "EX", ttlSeconds).then(() => undefined),
    undefined,
  );
}

export async function redisDel(key: string): Promise<void> {
  await safeRedis(() => redis!.del(key).then(() => undefined), undefined);
}

export async function withRedisLock<T>(
  key: string,
  ttlMs: number,
  work: () => Promise<T>,
): Promise<T> {
  if (!redis) return work();

  const token = crypto.randomUUID();
  const acquired = await safeRedis(() => redis!.set(key, token, "PX", ttlMs, "NX"), null);

  if (!acquired) return work();

  try {
    return await work();
  } finally {
    await safeRedis(async () => {
      const current = await redis!.get(key);
      if (current === token) await redis!.del(key);
    }, undefined);
  }
}
