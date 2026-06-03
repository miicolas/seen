import { jsonResponse } from "../../_shared/cors.ts";
import { getMovieDetail } from "../../_shared/tmdb.ts";
import { getCachedMovieDetail, upsertMovieDetail } from "../../_shared/cache.ts";
import type { Handler } from "../types.ts";

export const handleMovie: Handler = async (body, { language }) => {
  if (!body.tmdb_id) {
    return jsonResponse({ error: "tmdb_id is required" }, 400);
  }

  const cached = await getCachedMovieDetail(body.tmdb_id, "movie", language);
  if (cached) return jsonResponse({ ...cached, _cache: "hit" });

  const detail = await getMovieDetail(body.tmdb_id, language);
  await upsertMovieDetail(detail, language);
  return jsonResponse({ ...detail, _cache: "miss" });
};
