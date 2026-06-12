export type {
  MediaRef,
  WatchlistInput,
  WatchlistItem,
  WatchlistItemWithMedia,
  WatchlistListInput,
  WatchlistPage,
} from "./types";

export { addToWatchlist } from "./handlers/add";
export { getMyWatchlistPage } from "./handlers/list";
export { removeFromWatchlist } from "./handlers/remove";
