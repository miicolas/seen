export type {
  MediaRef,
  WatchlistInput,
  WatchlistItem,
  WatchlistItemWithMedia,
  WatchlistListInput,
  WatchlistPage,
} from "./types";

export { addToWatchlist } from "./handlers/add";
export { getMyWatchlistItem } from "./handlers/get-my";
export { getMyWatchlistPage } from "./handlers/list";
export { removeFromWatchlist } from "./handlers/remove";
