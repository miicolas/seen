import { invokeTmdb, normalizeSummary } from "./client";
import type { MediaType, TmdbMovieSummary, TmdbPagedResult } from "./types";

type DiscoverParams = Record<string, string | number | boolean | undefined>;

export async function discoverMedia(
  mediaType: MediaType,
  params: DiscoverParams,
  page = 1,
): Promise<TmdbMovieSummary[]> {
  const data = await invokeTmdb<TmdbPagedResult>({
    action: "discover",
    media_type: mediaType,
    params,
    page,
  });
  return data.results.map((item) => normalizeSummary(item, mediaType));
}

export function discoverMovies(
  params: DiscoverParams,
  page = 1,
): Promise<TmdbMovieSummary[]> {
  return discoverMedia("movie", params, page);
}

export function discoverTv(
  params: DiscoverParams,
  page = 1,
): Promise<TmdbMovieSummary[]> {
  return discoverMedia("tv", params, page);
}
