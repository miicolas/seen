import { relations } from "drizzle-orm";

import { user } from "../auth";
import { pushTokens } from "./schema";

export const pushTokenRelations = relations(pushTokens, ({ one }) => ({
  user: one(user, {
    fields: [pushTokens.userId],
    references: [user.id],
  }),
}));
