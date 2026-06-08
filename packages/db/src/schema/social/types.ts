import type { follows, followRequests, profileContactIdentifiers } from "./schema";

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;

export type FollowRequest = typeof followRequests.$inferSelect;
export type NewFollowRequest = typeof followRequests.$inferInsert;

export type ProfileContactIdentifier = typeof profileContactIdentifiers.$inferSelect;
export type NewProfileContactIdentifier = typeof profileContactIdentifiers.$inferInsert;
