import { jsonResponse } from "../../_shared/cors.ts";
import { getTvEpisodeDetail } from "../../_shared/tmdb.ts";
import type { Handler } from "../types.ts";

export const handleTvEpisode: Handler = async (body, { language }) => {
  const seriesId = Number(body.series_id ?? body.tmdb_id);
  const seasonNumber = Number(body.season_number);
  const episodeNumber = Number(body.episode_number);

  if (!Number.isFinite(seriesId) || seriesId <= 0) {
    return jsonResponse({ error: "series_id is required" }, 400);
  }

  if (!Number.isInteger(seasonNumber) || seasonNumber < 0) {
    return jsonResponse({ error: "season_number is required" }, 400);
  }

  if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) {
    return jsonResponse({ error: "episode_number is required" }, 400);
  }

  const detail = await getTvEpisodeDetail(
    seriesId,
    seasonNumber,
    episodeNumber,
    language,
  );
  return jsonResponse(detail);
};
