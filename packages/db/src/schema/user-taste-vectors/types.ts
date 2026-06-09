import type { userTasteVectors } from "./schema";

export type UserTasteVector = typeof userTasteVectors.$inferSelect;
export type NewUserTasteVector = typeof userTasteVectors.$inferInsert;
