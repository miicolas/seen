import { asDateString, asNumber, asRecord, asString } from "../../../lib/coerce";
import type { EpisodeDetailDto, EpisodeSummaryDto } from "../model";
import { toCredits } from "./to-credit";

export function toEpisodeSummary(raw: unknown): EpisodeSummaryDto {
  const obj = asRecord(raw);
  return {
    id: asNumber(obj.id) ?? 0,
    name: asString(obj.name),
    overview: asString(obj.overview),
    episode_number: asNumber(obj.episode_number) ?? 0,
    season_number: asNumber(obj.season_number) ?? 0,
    air_date: asDateString(obj.air_date) ?? null,
    still_path: asString(obj.still_path) ?? null,
    runtime: asNumber(obj.runtime) ?? null,
    vote_average: asNumber(obj.vote_average),
    vote_count: asNumber(obj.vote_count),
    crew: toCredits(obj.crew),
    guest_stars: toCredits(obj.guest_stars),
  };
}

export function toEpisodeDetail(raw: unknown): EpisodeDetailDto {
  const obj = asRecord(raw);
  const credits = obj.credits ? asRecord(obj.credits) : undefined;
  return {
    ...toEpisodeSummary(obj),
    credits: credits
      ? {
          cast: toCredits(credits.cast),
          crew: toCredits(credits.crew),
          guest_stars: toCredits(credits.guest_stars),
        }
      : undefined,
  };
}
