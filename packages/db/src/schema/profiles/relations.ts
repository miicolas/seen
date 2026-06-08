import { relations } from "drizzle-orm";

import { user } from "../auth";
import { episodeReviews, reviews } from "../reviews/schema";
import { likes, notInterested, watchlist } from "../library/schema";
import { profiles } from "./schema";

export const userDomainRelations = relations(user, ({ many, one }) => ({
  profile: one(profiles),
  reviews: many(reviews),
  episodeReviews: many(episodeReviews),
  watchlist: many(watchlist),
  likes: many(likes),
  notInterested: many(notInterested),
}));

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.id],
    references: [user.id],
  }),
}));
