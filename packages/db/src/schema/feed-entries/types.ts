import type { feedEntries } from "./schema";

export type FeedEntryRow = typeof feedEntries.$inferSelect;
export type NewFeedEntryRow = typeof feedEntries.$inferInsert;
