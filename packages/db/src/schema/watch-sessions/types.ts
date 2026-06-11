import type { watchSessionInvitations, watchSessionParticipants, watchSessions } from "./schema";

export type WatchSession = typeof watchSessions.$inferSelect;
export type NewWatchSession = typeof watchSessions.$inferInsert;

export type WatchSessionParticipant = typeof watchSessionParticipants.$inferSelect;
export type NewWatchSessionParticipant = typeof watchSessionParticipants.$inferInsert;

export type WatchSessionInvitation = typeof watchSessionInvitations.$inferSelect;
export type NewWatchSessionInvitation = typeof watchSessionInvitations.$inferInsert;
