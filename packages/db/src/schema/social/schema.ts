import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { user } from "../auth";

// A one-directional follow edge: `follower` follows `followee`. A mutual follow is
// two rows. Approval-required targets gate this behind `follow_requests` first.
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("follows_follower_followee_unique").on(table.followerId, table.followeeId),
    index("follows_followee_created_idx").on(table.followeeId, table.createdAt),
    index("follows_follower_created_idx").on(table.followerId, table.createdAt),
    check("follows_no_self_follow", sql`${table.followerId} <> ${table.followeeId}`),
  ],
);

// A pending/handled request to follow an approval-required profile. One row per
// (requester, target); re-requesting after a reject flips the same row back to pending.
export const followRequests = pgTable(
  "follow_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetId: text("target_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("follow_requests_requester_target_unique").on(table.requesterId, table.targetId),
    index("follow_requests_target_status_created_idx").on(
      table.targetId,
      table.status,
      table.createdAt,
    ),
    check("follow_requests_no_self", sql`${table.requesterId} <> ${table.targetId}`),
    check(
      "follow_requests_status_check",
      sql`${table.status} in ('pending', 'approved', 'rejected')`,
    ),
  ],
);

// Hashed contact identifiers used for opt-in, on-device contact matching. We store
// ONLY the salted hash (never the plaintext email/phone). Rows exist only while the
// owner has contact discovery enabled. Phone is supported for future verified-phone
// data; v1 populates email hashes from verified Seen emails.
export const profileContactIdentifiers = pgTable(
  "profile_contact_identifiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    hash: text("hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("profile_contact_identifiers_user_kind_hash_unique").on(
      table.userId,
      table.kind,
      table.hash,
    ),
    index("profile_contact_identifiers_kind_hash_idx").on(table.kind, table.hash),
    check("profile_contact_identifiers_kind_check", sql`${table.kind} in ('email', 'phone')`),
  ],
);
