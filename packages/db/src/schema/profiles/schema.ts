import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth";

export const profiles = pgTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    username: text("username").notNull().unique(),
    avatarPath: text("avatar_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("profiles_full_name_not_blank", sql`length(btrim(${table.fullName})) > 0`),
    check(
      "profiles_username_format",
      sql`${table.username} = lower(${table.username}) and ${table.username} ~ '^[a-z0-9_.]{3,20}$'`,
    ),
  ],
);
