import { jsonResponse } from "../../_shared/cors.ts";
import { findByExternalId } from "../../_shared/tmdb.ts";
import { upsertMovieList } from "../../_shared/cache.ts";
import type { Handler } from "../types.ts";

export const handleFind: Handler = async (body, { language, warmCache }) => {
  if (!body.external_id) {
    return jsonResponse({ error: "external_id is required" }, 400);
  }

  const result = await findByExternalId(
    body.external_id,
    body.source ?? "imdb_id",
    language,
  );
  warmCache(upsertMovieList(result.movie_results ?? [], language));
  return jsonResponse(result);
};
