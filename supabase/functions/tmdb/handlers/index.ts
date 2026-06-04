import type { Handler, TmdbAction } from "../types.ts";
import { handleSearch } from "./search.ts";
import { handleDiscover } from "./discover.ts";
import { handleTrending } from "./trending.ts";
import { handleFind } from "./find.ts";
import { handleMovie } from "./movie.ts";
import { handleTvEpisode } from "./tv-episode.ts";
import { handleTvSeason } from "./tv-season.ts";

export const handlers: Record<TmdbAction, Handler> = {
  search: handleSearch,
  discover: handleDiscover,
  trending: handleTrending,
  find: handleFind,
  movie: handleMovie,
  tv_season: handleTvSeason,
  tv_episode: handleTvEpisode,
};
