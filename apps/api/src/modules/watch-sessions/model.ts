import { Elysia, t } from "elysia";

const participant = t.Object({
  user_id: t.String(),
  username: t.Nullable(t.String()),
  full_name: t.Nullable(t.String()),
  avatar_path: t.Nullable(t.String()),
  role: t.String(),
  status: t.String(),
  position_seconds: t.Number(),
  duration_seconds: t.Number(),
  last_progress_at: t.String(),
  started_at: t.String(),
  completed_at: t.Nullable(t.String()),
});

const sessionBase = {
  id: t.String(),
  host_id: t.String(),
  media_type: t.String(),
  tmdb_id: t.Number(),
  season_number: t.Nullable(t.Number()),
  episode_number: t.Nullable(t.Number()),
  episode_tmdb_id: t.Nullable(t.Number()),
  title: t.String(),
  poster_path: t.Nullable(t.String()),
  duration_seconds: t.Number(),
  status: t.String(),
  created_at: t.String(),
};

const session = t.Object({
  ...sessionBase,
  watching_with: t.Optional(t.Nullable(t.String())),
  me: participant,
});

const profileCard = t.Object({
  user_id: t.String(),
  username: t.Nullable(t.String()),
  full_name: t.Nullable(t.String()),
  avatar_path: t.Nullable(t.String()),
});

const invitation = t.Object({
  id: t.String(),
  session_id: t.String(),
  status: t.String(),
  expires_at: t.String(),
  created_at: t.String(),
  inviter: profileCard,
  session: t.Object({
    media_type: t.String(),
    tmdb_id: t.Number(),
    season_number: t.Nullable(t.Number()),
    episode_number: t.Nullable(t.Number()),
    title: t.String(),
    poster_path: t.Nullable(t.String()),
    duration_seconds: t.Number(),
  }),
});

const sessionDetail = t.Object({
  ...sessionBase,
  me: t.Nullable(participant),
  participants: t.Array(participant),
  pending_invitations: t.Array(
    t.Object({
      id: t.String(),
      status: t.String(),
      expires_at: t.String(),
      invitee: profileCard,
    }),
  ),
});

export const WatchSessionModel = new Elysia({
  name: "WatchSession.Model",
}).model({
  "watchSessions.Session": session,
  "watchSessions.NullableSession": t.Nullable(session),
  "watchSessions.SessionDetail": sessionDetail,
  "watchSessions.StartInput": t.Object({
    media_type: t.Union([t.Literal("movie"), t.Literal("episode")]),
    tmdb_id: t.Number(),
    season_number: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
    episode_number: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
    episode_tmdb_id: t.Optional(t.Nullable(t.Number())),
    duration_seconds: t.Optional(t.Nullable(t.Number({ minimum: 60, maximum: 24 * 3600 }))),
  }),
  "watchSessions.SeekInput": t.Object({
    position_seconds: t.Number({ minimum: 0 }),
  }),
  "watchSessions.InviteInput": t.Object({
    invitee_id: t.String({ minLength: 1 }),
  }),
  "watchSessions.AcceptInput": t.Object({
    from_beginning: t.Optional(t.Boolean()),
  }),
  "watchSessions.Invitation": invitation,
  "watchSessions.InvitationList": t.Array(invitation),
  "watchSessions.FriendList": t.Array(profileCard),
  "watchSessions.OkResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const watchSessionModels = WatchSessionModel.models;
