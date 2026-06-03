import type { Handler, TmdbAction } from "../types.ts";
import { handleSearch } from "./search.ts";
import { handleDiscover } from "./discover.ts";
import { handleTrending } from "./trending.ts";
import { handleFind } from "./find.ts";
import { handleMovie } from "./movie.ts";

export const handlers: Record<TmdbAction, Handler> = {
  search: handleSearch,
  discover: handleDiscover,
  trending: handleTrending,
  find: handleFind,
  movie: handleMovie,
};
