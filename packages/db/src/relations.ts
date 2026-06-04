import { relations } from "drizzle-orm";

import {
  episodeReviews,
  profiles,
  reviews,
  user,
} from "./schema";

export const userDomainRelations = relations(user, ({ many, one }) => ({
  profile: one(profiles),
  reviews: many(reviews),
  episodeReviews: many(episodeReviews),
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
