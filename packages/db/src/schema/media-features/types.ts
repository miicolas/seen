import type { mediaFeatures } from "./schema";

export type MediaFeature = typeof mediaFeatures.$inferSelect;
export type NewMediaFeature = typeof mediaFeatures.$inferInsert;
