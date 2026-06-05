import { relations } from "drizzle-orm";

import { episodeReviews, profiles, reviews, user, watchlist } from "./schema";

export const userDomainRelations = relations(user, ({ many, one }) => ({
  profile: one(profiles),
  reviews: many(reviews),
  episodeReviews: many(episodeReviews),
  watchlist: many(watchlist),
}));

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.id],
    references: [user.id],
  }),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(user, {
    fields: [reviews.userId],
    references: [user.id],
  }),
}));

export const episodeReviewRelations = relations(episodeReviews, ({ one }) => ({
  user: one(user, {
    fields: [episodeReviews.userId],
    references: [user.id],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(user, {
    fields: [watchlist.userId],
    references: [user.id],
  }),
}));
