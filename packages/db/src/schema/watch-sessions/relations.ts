import { relations } from "drizzle-orm";

import { user } from "../auth";
import { watchSessionInvitations, watchSessionParticipants, watchSessions } from "./schema";

export const watchSessionRelations = relations(watchSessions, ({ one, many }) => ({
  host: one(user, {
    fields: [watchSessions.hostId],
    references: [user.id],
  }),
  participants: many(watchSessionParticipants),
  invitations: many(watchSessionInvitations),
}));

export const watchSessionParticipantRelations = relations(watchSessionParticipants, ({ one }) => ({
  session: one(watchSessions, {
    fields: [watchSessionParticipants.sessionId],
    references: [watchSessions.id],
  }),
  user: one(user, {
    fields: [watchSessionParticipants.userId],
    references: [user.id],
  }),
}));

export const watchSessionInvitationRelations = relations(watchSessionInvitations, ({ one }) => ({
  session: one(watchSessions, {
    fields: [watchSessionInvitations.sessionId],
    references: [watchSessions.id],
  }),
  inviter: one(user, {
    fields: [watchSessionInvitations.inviterId],
    references: [user.id],
    relationName: "sentWatchInvitations",
  }),
  invitee: one(user, {
    fields: [watchSessionInvitations.inviteeId],
    references: [user.id],
    relationName: "receivedWatchInvitations",
  }),
}));
