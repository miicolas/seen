import type { mediaRecommendations } from "./schema";

export type MediaRecommendation = typeof mediaRecommendations.$inferSelect;
export type NewMediaRecommendation = typeof mediaRecommendations.$inferInsert;
