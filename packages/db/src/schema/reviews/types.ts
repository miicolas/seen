import type { episodeReviews, reviews } from "./schema";

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type EpisodeReview = typeof episodeReviews.$inferSelect;
export type NewEpisodeReview = typeof episodeReviews.$inferInsert;
