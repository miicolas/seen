import { db } from "@seen/db";
import type { WatchSession, WatchSessionParticipant } from "@seen/db/schema";
import {
  profiles,
  watchSessionInvitations,
  watchSessionParticipants,
  watchSessions,
} from "@seen/db/schema";
import { and, eq, inArray, lte, ne, sql, type SQL } from "@seen/db/orm";

import { HttpError } from "../../lib/http-error";
import { deriveCurrentPosition, isAbandoned, type ParticipantProgress } from "./session-state";

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbLike = Db | Tx;

export type ParticipantDto = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_path: string | null;
  role: string;
  status: string;
  position_seconds: number;
  duration_seconds: number;
  last_progress_at: string;
  started_at: string;
  completed_at: string | null;
};

export type SessionDto = {
  id: string;
  host_id: string;
  media_type: string;
  tmdb_id: number;
  season_number: number | null;
  episode_number: number | null;
  episode_tmdb_id: number | null;
  title: string;
  poster_path: string | null;
  duration_seconds: number;
  status: string;
  created_at: string;
  watching_with?: string | null;
  me: ParticipantDto;
};

export type SessionDetailDto = Omit<SessionDto, "me"> & {
  me: ParticipantDto | null;
  participants: ParticipantDto[];
  pending_invitations: PendingInviteeDto[];
};

export type ProfileCardDto = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_path: string | null;
};

export type InvitationDto = {
  id: string;
  session_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  inviter: ProfileCardDto;
  session: {
    media_type: string;
    tmdb_id: number;
    season_number: number | null;
    episode_number: number | null;
    title: string;
    poster_path: string | null;
    duration_seconds: number;
  };
};

export type PendingInviteeDto = {
  id: string;
  status: string;
  expires_at: string;
  invitee: ProfileCardDto;
};

export function toProgress(row: WatchSessionParticipant): ParticipantProgress {
  return {
    status: row.status as ParticipantProgress["status"],
    positionSeconds: row.positionSeconds,
    durationSeconds: row.durationSeconds,
    lastProgressAt: row.lastProgressAt,
  };
}

type ProfileCard = { username: string; fullName: string; avatarPath: string | null };

export function serializeParticipant(
  row: WatchSessionParticipant,
  now: Date,
  profile?: ProfileCard | null,
): ParticipantDto {
  return {
    user_id: row.userId,
    username: profile?.username ?? null,
    full_name: profile?.fullName ?? null,
    avatar_path: profile?.avatarPath ?? null,
    role: row.role,
    status: row.status,
    position_seconds: deriveCurrentPosition(toProgress(row), now),
    duration_seconds: row.durationSeconds,
    last_progress_at: row.lastProgressAt.toISOString(),
    started_at: row.startedAt.toISOString(),
    completed_at: row.completedAt?.toISOString() ?? null,
  };
}

function serializeSessionBase(session: WatchSession): Omit<SessionDto, "me"> {
  return {
    id: session.id,
    host_id: session.hostId,
    media_type: session.mediaType,
    tmdb_id: session.tmdbId,
    season_number: session.seasonNumber,
    episode_number: session.episodeNumber,
    episode_tmdb_id: session.episodeTmdbId,
    title: session.title,
    poster_path: session.posterPath,
    duration_seconds: session.durationSeconds,
    status: session.status,
    created_at: session.createdAt.toISOString(),
  };
}

export function serializeSession(
  session: WatchSession,
  me: WatchSessionParticipant,
  now: Date,
  watchingWith?: string | null,
): SessionDto {
  return {
    ...serializeSessionBase(session),
    watching_with: watchingWith ?? null,
    me: serializeParticipant(me, now),
  };
}

export function toProfileCardDto(userId: string, profile?: ProfileCard | null): ProfileCardDto {
  return {
    user_id: userId,
    username: profile?.username ?? null,
    full_name: profile?.fullName ?? null,
    avatar_path: profile?.avatarPath ?? null,
  };
}

export function serializeSessionDetail(
  session: WatchSession,
  participants: WatchSessionParticipant[],
  pendingInvitations: { id: string; status: string; expiresAt: Date; inviteeId: string }[],
  viewerId: string,
  now: Date,
  profileCards: Map<string, ProfileCard>,
): SessionDetailDto {
  const me = participants.find((row) => row.userId === viewerId) ?? null;
  return {
    ...serializeSessionBase(session),
    me: me ? serializeParticipant(me, now, profileCards.get(me.userId)) : null,
    participants: participants.map((row) =>
      serializeParticipant(row, now, profileCards.get(row.userId)),
    ),
    pending_invitations: pendingInvitations.map((row) => ({
      id: row.id,
      status: row.status,
      expires_at: row.expiresAt.toISOString(),
      invitee: toProfileCardDto(row.inviteeId, profileCards.get(row.inviteeId)),
    })),
  };
}

export function serializeInvitation(
  invitation: {
    id: string;
    sessionId: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    inviterId: string;
  },
  session: WatchSession,
  inviterProfile?: ProfileCard | null,
): InvitationDto {
  return {
    id: invitation.id,
    session_id: invitation.sessionId,
    status: invitation.status,
    expires_at: invitation.expiresAt.toISOString(),
    created_at: invitation.createdAt.toISOString(),
    inviter: toProfileCardDto(invitation.inviterId, inviterProfile),
    session: {
      media_type: session.mediaType,
      tmdb_id: session.tmdbId,
      season_number: session.seasonNumber,
      episode_number: session.episodeNumber,
      title: session.title,
      poster_path: session.posterPath,
      duration_seconds: session.durationSeconds,
    },
  };
}

export async function loadProfileCards(userIds: string[]): Promise<Map<string, ProfileCard>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      fullName: profiles.fullName,
      avatarPath: profiles.avatarPath,
    })
    .from(profiles)
    .where(inArray(profiles.id, userIds));
  return new Map(rows.map((row) => [row.id, row]));
}

export async function lazyAbandon(
  rows: WatchSessionParticipant[],
  now: Date,
): Promise<WatchSessionParticipant[]> {
  const stale = rows.filter((row) => isAbandoned(toProgress(row), now));
  if (stale.length === 0) return rows;
  await db
    .update(watchSessionParticipants)
    .set({ status: "abandoned" })
    .where(
      inArray(
        watchSessionParticipants.id,
        stale.map((row) => row.id),
      ),
    );
  const staleIds = new Set(stale.map((row) => row.id));
  return rows.map((row) => (staleIds.has(row.id) ? { ...row, status: "abandoned" } : row));
}

export function derivedPositionSql(now: Date): SQL<number> {
  return sql`least(${watchSessionParticipants.positionSeconds} + greatest(floor(extract(epoch from (${now.toISOString()}::timestamptz - ${watchSessionParticipants.lastProgressAt})))::int, 0), ${watchSessionParticipants.durationSeconds})`;
}

export async function pauseParticipantsWhere(
  dbLike: DbLike,
  now: Date,
  where: SQL | undefined,
): Promise<void> {
  await dbLike
    .update(watchSessionParticipants)
    .set({
      status: "paused",
      positionSeconds: derivedPositionSql(now),
      lastProgressAt: now,
      pausedAt: now,
    })
    .where(and(eq(watchSessionParticipants.status, "active"), where));
}

export async function pauseActiveParticipants(
  dbLike: DbLike,
  userId: string,
  now: Date,
  excludeParticipantId?: string,
): Promise<void> {
  await pauseParticipantsWhere(
    dbLike,
    now,
    and(
      eq(watchSessionParticipants.userId, userId),
      excludeParticipantId ? ne(watchSessionParticipants.id, excludeParticipantId) : undefined,
    ),
  );
}

export async function expireStalePendingInvitations(
  scope: SQL | undefined,
  now = new Date(),
): Promise<void> {
  await db
    .update(watchSessionInvitations)
    .set({ status: "expired" })
    .where(
      and(
        eq(watchSessionInvitations.status, "pending"),
        lte(watchSessionInvitations.expiresAt, now),
        scope,
      ),
    );
}

export async function listOpenParticipations(
  userId: string,
): Promise<{ session: WatchSession; me: WatchSessionParticipant }[]> {
  const now = new Date();
  const rows = await db
    .select({ session: watchSessions, me: watchSessionParticipants })
    .from(watchSessionParticipants)
    .innerJoin(watchSessions, eq(watchSessions.id, watchSessionParticipants.sessionId))
    .where(
      and(
        eq(watchSessionParticipants.userId, userId),
        inArray(watchSessionParticipants.status, ["active", "paused"]),
        eq(watchSessions.status, "active"),
      ),
    )
    .orderBy(sql`${watchSessionParticipants.lastProgressAt} desc`);
  const cleaned = await lazyAbandon(
    rows.map((row) => row.me),
    now,
  );
  return rows
    .map((row, index) => ({ session: row.session, me: cleaned[index]! }))
    .filter((row) => row.me.status !== "abandoned");
}

export async function loadSessionWithParticipant(
  sessionId: string,
  userId: string,
): Promise<{ session: WatchSession; me: WatchSessionParticipant }> {
  const [row] = await db
    .select({ session: watchSessions, me: watchSessionParticipants })
    .from(watchSessions)
    .innerJoin(
      watchSessionParticipants,
      and(
        eq(watchSessionParticipants.sessionId, watchSessions.id),
        eq(watchSessionParticipants.userId, userId),
      ),
    )
    .where(eq(watchSessions.id, sessionId))
    .limit(1);
  if (!row) throw new HttpError(404, "Session not found.", "NOT_FOUND");
  return row;
}
