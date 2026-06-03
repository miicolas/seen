import { invokeTmdb, normalizeSummary } from "./client";
import type {
  MediaFilter,
  MediaType,
  TmdbMovieSummary,
  TmdbPagedResult,
} from "./types";

export async function searchMedia(
  query: string,
  filter: MediaFilter = "all",
  page = 1,
): Promise<TmdbMovieSummary[]> {
  const data = await invokeTmdb<TmdbPagedResult>({
    action: "search",
    media_type: filter,
    query,
    page,
  });
  const fallback: MediaType = filter === "tv" ? "tv" : "movie";
  return data.results.map((item) => normalizeSummary(item, fallback));
}
