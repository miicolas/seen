import type { movies } from "./schema";

export type Media = typeof movies.$inferSelect;
export type NewMedia = typeof movies.$inferInsert;
