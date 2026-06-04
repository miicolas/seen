import { jsonResponse } from "../../_shared/cors.ts";
import { getTvSeasonDetail } from "../../_shared/tmdb.ts";
import type { Handler } from "../types.ts";

export const handleTvSeason: Handler = async (body, { language }) => {
  const seriesId = Number(body.series_id ?? body.tmdb_id);
  const seasonNumber = Number(body.season_number);

  if (!Number.isFinite(seriesId) || seriesId <= 0) {
    return jsonResponse({ error: "series_id is required" }, 400);
  }

  if (!Number.isInteger(seasonNumber) || seasonNumber < 0) {
    return jsonResponse({ error: "season_number is required" }, 400);
  }

  const detail = await getTvSeasonDetail(seriesId, seasonNumber, language);
  return jsonResponse(detail);
};
