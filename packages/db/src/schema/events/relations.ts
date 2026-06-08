import { relations } from "drizzle-orm";

import { user } from "../auth";
import { interactionEvents, recommendationEvents } from "./schema";

export const interactionEventsRelations = relations(interactionEvents, ({ one }) => ({
  user: one(user, {
    fields: [interactionEvents.userId],
    references: [user.id],
  }),
}));

export const recommendationEventsRelations = relations(recommendationEvents, ({ one }) => ({
  user: one(user, {
    fields: [recommendationEvents.userId],
    references: [user.id],
  }),
}));
