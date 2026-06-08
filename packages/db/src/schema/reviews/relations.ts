import { relations } from "drizzle-orm";

import { user } from "../auth";
import { episodeReviews, reviews } from "./schema";

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
