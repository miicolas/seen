import type { TmdbMovieSummary } from "./types";

export async function findByExternalId(
  externalId: string,
  source = "imdb_id",
): Promise<TmdbMovieSummary[]> {
  void externalId;
  void source;
  return [];
}
