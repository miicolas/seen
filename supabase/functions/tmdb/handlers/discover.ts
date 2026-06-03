import { jsonResponse } from "../../_shared/cors.ts";
import { discover } from "../../_shared/tmdb.ts";
import { upsertMovieList } from "../../_shared/cache.ts";
import type { Handler } from "../types.ts";

export const handleDiscover: Handler = async (body, { language, warmCache, mediaTypeOf }) => {
  const mediaType = mediaTypeOf(body.media_type);
  const result = await discover(mediaType, {
    language,
    page: body.page ?? 1,
    ...(body.params ?? {}),
  });
  warmCache(upsertMovieList(result.results, language, mediaType));
  return jsonResponse(result);
};
