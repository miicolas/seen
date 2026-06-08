import type { mediaProviders, providers, userPlatforms } from "./schema";

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;

export type MediaProvider = typeof mediaProviders.$inferSelect;
export type NewMediaProvider = typeof mediaProviders.$inferInsert;

export type UserPlatform = typeof userPlatforms.$inferSelect;
export type NewUserPlatform = typeof userPlatforms.$inferInsert;
