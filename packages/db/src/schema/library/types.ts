import type { likes, notInterested, watchlist } from "./schema";

export type WatchlistItem = typeof watchlist.$inferSelect;
export type NewWatchlistItem = typeof watchlist.$inferInsert;

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;

export type NotInterestedItem = typeof notInterested.$inferSelect;
export type NewNotInterestedItem = typeof notInterested.$inferInsert;
