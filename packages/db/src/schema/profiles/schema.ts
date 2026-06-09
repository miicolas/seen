import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
    // How new follows are handled: `open` follows take effect immediately,
    // `approval_required` creates a pending follow request the owner must accept.
    followPolicy: text("follow_policy").notNull().default("open"),
    // Who can see profile detail (activity, reviews). Non-followers see only a
    // minimal locked card when this is `followers`.
    profileVisibility: text("profile_visibility").notNull().default("public"),
    // Visibility applied to newly added watchlist rows.
    defaultWatchlistVisibility: text("default_watchlist_visibility").notNull().default("private"),
    // Opt-in: while true, the owner's hashed contact identifiers are stored and
    // they can be surfaced by contact matching.
    contactDiscoveryEnabled: boolean("contact_discovery_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("profiles_full_name_not_blank", sql`length(btrim(${table.fullName})) > 0`),
    check(
      "profiles_username_format",
      sql`${table.username} = lower(${table.username}) and ${table.username} ~ '^[a-z0-9_.]{3,20}$'`,
    ),
    check(
      "profiles_follow_policy_check",
      sql`${table.followPolicy} in ('open', 'approval_required')`,
    ),
    check(
      "profiles_profile_visibility_check",
      sql`${table.profileVisibility} in ('public', 'followers')`,
    ),
    check(
      "profiles_default_watchlist_visibility_check",
      sql`${table.defaultWatchlistVisibility} in ('private', 'followers', 'public')`,
    ),
  ],
);
