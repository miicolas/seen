import type { interactionEvents, recommendationEvents } from "./schema";

export type InteractionEvent = typeof interactionEvents.$inferSelect;
export type NewInteractionEvent = typeof interactionEvents.$inferInsert;

export type RecommendationEvent = typeof recommendationEvents.$inferSelect;
export type NewRecommendationEvent = typeof recommendationEvents.$inferInsert;
