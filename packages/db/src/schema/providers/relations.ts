import { relations } from "drizzle-orm";

import { user } from "../auth";
import { providers, userPlatforms } from "./schema";

export const providersRelations = relations(providers, ({ many }) => ({
  userPlatforms: many(userPlatforms),
}));

export const userPlatformsRelations = relations(userPlatforms, ({ one }) => ({
  user: one(user, {
    fields: [userPlatforms.userId],
    references: [user.id],
  }),
  provider: one(providers, {
    fields: [userPlatforms.providerId],
    references: [providers.providerId],
  }),
}));
