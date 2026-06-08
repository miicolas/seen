import { relations } from "drizzle-orm";

import { user } from "../auth";
import { likes, notInterested, watchlist } from "./schema";

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(user, {
    fields: [watchlist.userId],
    references: [user.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(user, {
    fields: [likes.userId],
    references: [user.id],
  }),
}));

export const notInterestedRelations = relations(notInterested, ({ one }) => ({
  user: one(user, {
    fields: [notInterested.userId],
    references: [user.id],
  }),
}));
