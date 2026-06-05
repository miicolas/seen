import { asDateString, asNumber, asRecord, asString } from "../../../lib/coerce";
import type { SeasonDetailDto, SeasonSummaryDto } from "../model";
import { toEpisodeSummary } from "./to-episode-detail";

export function toSeasonSummary(raw: unknown): SeasonSummaryDto {
  const obj = asRecord(raw);
  return {
    id: asNumber(obj.id) ?? 0,
    name: asString(obj.name),
    overview: asString(obj.overview),
    air_date: asDateString(obj.air_date) ?? null,
    episode_count: asNumber(obj.episode_count),
    poster_path: asString(obj.poster_path) ?? null,
    season_number: asNumber(obj.season_number) ?? 0,
    vote_average: asNumber(obj.vote_average),
  };
}

export function toSeasonDetail(raw: unknown): SeasonDetailDto {
  const obj = asRecord(raw);
  return {
    ...toSeasonSummary(obj),
    episodes: Array.isArray(obj.episodes) ? obj.episodes.map(toEpisodeSummary) : undefined,
  };
}
