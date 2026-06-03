import { invokeTmdb, normalizeSummary } from "./client";
import type { TmdbFindResult, TmdbMovieSummary } from "./types";

export async function findByExternalId(
  externalId: string,
  source = "imdb_id",
): Promise<TmdbMovieSummary[]> {
  const data = await invokeTmdb<TmdbFindResult>({
    action: "find",
    external_id: externalId,
    source,
  });
  return [
    ...(data.movie_results ?? []).map((item) => normalizeSummary(item, "movie")),
    ...(data.tv_results ?? []).map((item) => normalizeSummary(item, "tv")),
  ];
}
