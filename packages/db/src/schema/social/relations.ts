import { relations } from "drizzle-orm";

import { user } from "../auth";
import { follows, followRequests, profileContactIdentifiers } from "./schema";

export const followRelations = relations(follows, ({ one }) => ({
  follower: one(user, {
    fields: [follows.followerId],
    references: [user.id],
    relationName: "following",
  }),
  followee: one(user, {
    fields: [follows.followeeId],
    references: [user.id],
    relationName: "followers",
  }),
}));

export const followRequestRelations = relations(followRequests, ({ one }) => ({
  requester: one(user, {
    fields: [followRequests.requesterId],
    references: [user.id],
    relationName: "outgoingFollowRequests",
  }),
  target: one(user, {
    fields: [followRequests.targetId],
    references: [user.id],
    relationName: "incomingFollowRequests",
  }),
}));

export const profileContactIdentifierRelations = relations(
  profileContactIdentifiers,
  ({ one }) => ({
    user: one(user, {
      fields: [profileContactIdentifiers.userId],
      references: [user.id],
    }),
  }),
);
