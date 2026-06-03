import { jsonResponse } from "../../_shared/cors.ts";
import { getMediaDetail } from "../../_shared/tmdb.ts";
import { getCachedMovieDetail, upsertMovieDetail } from "../../_shared/cache.ts";
import type { Handler } from "../types.ts";

export const handleMovie: Handler = async (body, { language }) => {
  if (!body.tmdb_id) {
    return jsonResponse({ error: "tmdb_id is required" }, 400);
  }

  const mediaType = body.media_type === "tv" ? "tv" : "movie";

  const cached = await getCachedMovieDetail(body.tmdb_id, mediaType, language);
  if (cached) return jsonResponse({ ...cached, _cache: "hit" });

  const detail = await getMediaDetail(mediaType, body.tmdb_id, language);
  await upsertMovieDetail(detail, language, mediaType);
  return jsonResponse({ ...detail, _cache: "miss" });
};
