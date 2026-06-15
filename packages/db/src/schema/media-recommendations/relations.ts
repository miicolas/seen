import { relations } from "drizzle-orm";

import { user } from "../auth";
import { mediaRecommendations } from "./schema";

export const mediaRecommendationRelations = relations(mediaRecommendations, ({ one }) => ({
  sender: one(user, {
    fields: [mediaRecommendations.senderId],
    references: [user.id],
    relationName: "sentMediaRecommendations",
  }),
  recipient: one(user, {
    fields: [mediaRecommendations.recipientId],
    references: [user.id],
    relationName: "receivedMediaRecommendations",
  }),
}));
