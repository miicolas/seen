import { env } from "../../env";
import { HttpError } from "../../lib/http-error";
import { redisGetJson, redisSetJson, withRedisLock } from "../../lib/redis";
import { DEFAULT_LANGUAGE, HOT_TTL_SECONDS } from "./constants";
import type { TmdbParams } from "./types";

// TMDB HTTP client: authenticated fetch with a Redis cache and a lock to
// collapse concurrent fetches of the same key. Normalization lives in
// ./normalize, cache warming in ./persist, list fetchers in ./summaries.

const TMDB_BASE = "https://api.themoviedb.org/3";

function tmdbAuthHeaders(): Record<string, string> {
  if (!env.tmdbToken) return { "Content-Type": "application/json;charset=utf-8" };
  return {
    Authorization: `Bearer ${env.tmdbToken}`,
    "Content-Type": "application/json;charset=utf-8",
  };
}

function cacheKey(path: string, params: TmdbParams) {
  const sorted = Object.entries(params)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `tmdb:${path}:${JSON.stringify(sorted)}`;
}

export async function tmdbFetch<T>(
  path: string,
  params: TmdbParams = {},
  ttlSeconds = HOT_TTL_SECONDS,
): Promise<T> {
  const normalizedParams = {
    language: DEFAULT_LANGUAGE,
    include_adult: false,
    ...params,
  };
  const key = cacheKey(path, normalizedParams);
  const cached = await redisGetJson<T>(key);
  if (cached) return cached;

  return withRedisLock(`lock:${key}`, 5_000, async () => {
    const lockedCached = await redisGetJson<T>(key);
    if (lockedCached) return lockedCached;

    const url = new URL(`${TMDB_BASE}${path}`);
    for (const [param, value] of Object.entries(normalizedParams)) {
      if (value !== undefined) url.searchParams.set(param, String(value));
    }

    const headers = tmdbAuthHeaders();
    if (!env.tmdbToken) {
      if (!env.tmdbApiKey) {
        throw new HttpError(500, "TMDB credentials are not configured");
      }
      url.searchParams.set("api_key", env.tmdbApiKey);
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      let message = response.statusText;
      let statusCode: number | undefined;
      try {
        const body = (await response.json()) as {
          status_message?: string;
          status_code?: number;
        };
        message = body.status_message ?? message;
        statusCode = body.status_code;
      } catch {
        message = response.statusText;
      }
      throw new HttpError(response.status, message, statusCode?.toString());
    }

    const data = (await response.json()) as T;
    await redisSetJson(key, data, ttlSeconds);
    return data;
  });
}
