import { db } from "@seen/db";
import { follows, followRequests, profiles } from "@seen/db/schema";
import { and, count, desc, eq, inArray } from "@seen/db/orm";

import { HttpError } from "../../lib/http-error";
import { getSocialContexts, type SocialContext } from "./social-context";

export type ProfileRow = typeof profiles.$inferSelect;

export type RequestStatus = "none" | "pending" | "rejected";

export type ViewerState = {
  isFollowing: boolean;
  followsMe: boolean;
  requestStatus: RequestStatus;
};

function defaultViewerState(): ViewerState {
  return { isFollowing: false, followsMe: false, requestStatus: "none" };
}

export function getViewerState(states: Map<string, ViewerState>, profileId: string): ViewerState {
  return states.get(profileId) ?? defaultViewerState();
}

export function normalizePagination(limit: number, offset: number, max = 50) {
  return {
    pageSize: Math.max(1, Math.min(max, limit)),
    offset: Math.max(0, offset),
  };
}

// The viewer's relationship to each of `targetIds`, resolved in three batched
// reads regardless of how many targets are passed.
export async function getViewerStates(
  viewerId: string,
  targetIds: string[],
): Promise<Map<string, ViewerState>> {
  const states = new Map<string, ViewerState>();
  const ids = [...new Set(targetIds)].filter((id) => id !== viewerId);
  for (const id of targetIds) {
    states.set(id, defaultViewerState());
  }
  if (ids.length === 0) return states;

  const [followingRows, followerRows, requestRows] = await Promise.all([
    db
      .select({ id: follows.followeeId })
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), inArray(follows.followeeId, ids))),
    db
      .select({ id: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followeeId, viewerId), inArray(follows.followerId, ids))),
    db
      .select({ id: followRequests.targetId, status: followRequests.status })
      .from(followRequests)
      .where(and(eq(followRequests.requesterId, viewerId), inArray(followRequests.targetId, ids))),
  ]);

  for (const row of followingRows) {
    const state = states.get(row.id);
    if (state) state.isFollowing = true;
  }
  for (const row of followerRows) {
    const state = states.get(row.id);
    if (state) state.followsMe = true;
  }
  for (const row of requestRows) {
    const state = states.get(row.id);
    if (state && (row.status === "pending" || row.status === "rejected")) {
      state.requestStatus = row.status;
    }
  }
  return states;
}

export async function loadProfileRow(profileId: string): Promise<ProfileRow> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (!row) throw new HttpError(404, "Profile not found.", "profile-not-found");
  return row;
}

// Whether `viewerId` may see the profile's detail (activity, reviews). Owner and
// `public` profiles are always visible; `followers` profiles need a live follow.
export function canViewProfileDetail(
  viewerId: string,
  row: ProfileRow,
  state: ViewerState,
): boolean {
  if (viewerId === row.id) return true;
  if (row.profileVisibility === "public") return true;
  return state.isFollowing;
}

export function assertCanViewProfileDetail(
  viewerId: string,
  row: ProfileRow,
  state: ViewerState,
): void {
  if (!canViewProfileDetail(viewerId, row, state)) {
    throw new HttpError(403, "This profile is private.", "profile-locked");
  }
}

export async function loadViewableProfile(viewerId: string, profileId: string) {
  const row = await loadProfileRow(profileId);
  const states = await getViewerStates(viewerId, [profileId]);
  const state = getViewerState(states, profileId);
  assertCanViewProfileDetail(viewerId, row, state);
  return { row, state };
}

export async function listProfileConnections(
  viewerId: string,
  profileId: string,
  kind: "followers" | "following",
  limit = 20,
  offset = 0,
) {
  await loadViewableProfile(viewerId, profileId);

  const { pageSize, offset: from } = normalizePagination(limit, offset);
  const joinedProfileId = kind === "followers" ? follows.followerId : follows.followeeId;
  const targetProfileId = kind === "followers" ? follows.followeeId : follows.followerId;

  const rows = await db
    .select({ profile: profiles })
    .from(follows)
    .innerJoin(profiles, eq(profiles.id, joinedProfileId))
    .where(eq(targetProfileId, profileId))
    .orderBy(desc(follows.createdAt))
    .limit(pageSize)
    .offset(from);

  return buildProfileCards(
    viewerId,
    rows.map((entry) => entry.profile),
  );
}

// Watchlist rows carry their own visibility on top of the profile's. Owner sees
// everything; others see `public` always and `followers` only when following.
export function canViewWatchlistVisibility(
  visibility: string,
  viewerId: string,
  ownerId: string,
  isFollowing: boolean,
): boolean {
  if (viewerId === ownerId) return true;
  if (visibility === "public") return true;
  if (visibility === "followers") return isFollowing;
  return false;
}

export async function getFollowCounts(
  profileId: string,
): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    db.select({ value: count() }).from(follows).where(eq(follows.followeeId, profileId)),
    db.select({ value: count() }).from(follows).where(eq(follows.followerId, profileId)),
  ]);
  return {
    followers: followers[0]?.value ?? 0,
    following: following[0]?.value ?? 0,
  };
}

export function toProfileCard(
  row: ProfileRow,
  viewerId: string,
  state: ViewerState,
  context?: SocialContext,
) {
  return {
    id: row.id,
    username: row.username,
    full_name: row.fullName,
    avatar_path: row.avatarPath,
    is_me: row.id === viewerId,
    is_following: state.isFollowing,
    follows_me: state.followsMe,
    request_status: state.requestStatus,
    ...(context
      ? {
          followers_count: context.followersCount,
          seen_count: context.seenCount,
          mutual_followers: context.mutualFollowers,
          mutual_followers_count: context.mutualFollowersCount,
        }
      : {}),
  };
}

export async function buildProfileDetail(viewerId: string, row: ProfileRow) {
  const [states, contexts, counts] = await Promise.all([
    getViewerStates(viewerId, [row.id]),
    getSocialContexts(viewerId, [row.id]),
    getFollowCounts(row.id),
  ]);
  const state = getViewerState(states, row.id);
  return {
    ...toProfileCard(row, viewerId, state, contexts.get(row.id)),
    follow_policy: row.followPolicy as "open" | "approval_required",
    profile_visibility: row.profileVisibility as "public" | "followers",
    followers_count: counts.followers,
    following_count: counts.following,
    locked: !canViewProfileDetail(viewerId, row, state),
  };
}

export async function buildProfileCards(viewerId: string, rows: ProfileRow[]) {
  const ids = rows.map((row) => row.id);
  const [states, contexts] = await Promise.all([
    getViewerStates(viewerId, ids),
    getSocialContexts(viewerId, ids),
  ]);
  return rows.map((row) =>
    toProfileCard(row, viewerId, getViewerState(states, row.id), contexts.get(row.id)),
  );
}
