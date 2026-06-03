import { jsonResponse } from "../../_shared/cors.ts";
import { trending } from "../../_shared/tmdb.ts";
import { upsertMovieList } from "../../_shared/cache.ts";
import type { Handler } from "../types.ts";

export const handleTrending: Handler = async (body, { language, warmCache, mediaTypeOf }) => {
  const media = body.media_type ?? "all";
  const result = await trending(
    media === "all" ? "all" : mediaTypeOf(media),
    body.time_window ?? "week",
    language,
  );
  warmCache(upsertMovieList(result.results, language, mediaTypeOf(body.media_type)));
  return jsonResponse(result);
};
