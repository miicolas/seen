import { jsonResponse } from "../../_shared/cors.ts";
import { search } from "../../_shared/tmdb.ts";
import { upsertMovieList } from "../../_shared/cache.ts";
import type { Handler } from "../types.ts";

export const handleSearch: Handler = async (body, { language, warmCache, mediaTypeOf }) => {
  if (!body.query) return jsonResponse({ error: "query is required" }, 400);

  const media = body.media_type ?? "all";
  const result = await search(
    media === "all" ? "all" : mediaTypeOf(media),
    body.query,
    body.page ?? 1,
    language,
  );
  result.results = (result.results ?? []).filter((item) => item.media_type !== "person");
  warmCache(upsertMovieList(result.results, language, mediaTypeOf(body.media_type)));
  return jsonResponse(result);
};
