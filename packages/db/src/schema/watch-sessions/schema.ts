import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "../auth";

export const watchSessions = pgTable(
  "watch_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostId: text("host_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    seasonNumber: integer("season_number"),
    episodeNumber: integer("episode_number"),
    episodeTmdbId: bigint("episode_tmdb_id", { mode: "number" }),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    durationSeconds: integer("duration_seconds").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("watch_sessions_host_status_idx").on(table.hostId, table.status),
    index("watch_sessions_media_idx").on(table.mediaType, table.tmdbId),
    check("watch_sessions_media_type_check", sql`${table.mediaType} in ('movie', 'episode')`),
    check(
      "watch_sessions_status_check",
      sql`${table.status} in ('active', 'completed', 'canceled')`,
    ),
    check("watch_sessions_duration_check", sql`${table.durationSeconds} > 0`),
    check(
      "watch_sessions_episode_fields_check",
      sql`(${table.mediaType} = 'movie' and ${table.seasonNumber} is null and ${table.episodeNumber} is null and ${table.episodeTmdbId} is null) or (${table.mediaType} = 'episode' and ${table.seasonNumber} is not null and ${table.episodeNumber} is not null)`,
    ),
  ],
);

export const watchSessionParticipants = pgTable(
  "watch_session_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => watchSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("host"),
    status: text("status").notNull().default("active"),
    positionSeconds: integer("position_seconds").notNull().default(0),
    durationSeconds: integer("duration_seconds").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastProgressAt: timestamp("last_progress_at", { withTimezone: true }).notNull().defaultNow(),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("watch_session_participants_session_user_unique").on(table.sessionId, table.userId),
    uniqueIndex("watch_session_participants_one_active_per_user")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
    index("watch_session_participants_user_status_progress_idx").on(
      table.userId,
      table.status,
      table.lastProgressAt,
    ),
    index("watch_session_participants_session_idx").on(table.sessionId),
    check("watch_session_participants_role_check", sql`${table.role} in ('host', 'guest')`),
    check(
      "watch_session_participants_status_check",
      sql`${table.status} in ('active', 'paused', 'completed', 'abandoned')`,
    ),
    check("watch_session_participants_position_check", sql`${table.positionSeconds} >= 0`),
    check("watch_session_participants_duration_check", sql`${table.durationSeconds} > 0`),
  ],
);

export const watchSessionInvitations = pgTable(
  "watch_session_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => watchSessions.id, { onDelete: "cascade" }),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    inviteeId: text("invitee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("watch_session_invitations_session_invitee_unique").on(table.sessionId, table.inviteeId),
    index("watch_session_invitations_invitee_status_created_idx").on(
      table.inviteeId,
      table.status,
      table.createdAt,
    ),
    check(
      "watch_session_invitations_status_check",
      sql`${table.status} in ('pending', 'accepted', 'declined', 'canceled', 'expired')`,
    ),
    check(
      "watch_session_invitations_no_self_invite",
      sql`${table.inviterId} <> ${table.inviteeId}`,
    ),
  ],
);
