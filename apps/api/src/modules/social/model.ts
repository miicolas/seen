import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);
const requestStatus = t.Union([t.Literal("none"), t.Literal("pending"), t.Literal("rejected")]);

const profileCard = t.Object({
  id: t.String(),
  username: t.String(),
  full_name: t.String(),
  avatar_path: t.Nullable(t.String()),
  is_me: t.Boolean(),
  is_following: t.Boolean(),
  follows_me: t.Boolean(),
  request_status: requestStatus,
});

const profile = t.Composite([
  profileCard,
  t.Object({
    follow_policy: t.Union([t.Literal("open"), t.Literal("approval_required")]),
    profile_visibility: t.Union([t.Literal("public"), t.Literal("followers")]),
    followers_count: t.Number(),
    following_count: t.Number(),
    // True when the viewer may not see this profile's detail (activity/watchlist).
    locked: t.Boolean(),
  }),
]);

const mediaSummary = t.Object({
  id: t.Number(),
  media_type: mediaType,
  title: t.Optional(t.String()),
  original_title: t.Optional(t.String()),
  overview: t.Optional(t.String()),
  release_date: t.Optional(t.String()),
  runtime: t.Optional(t.Nullable(t.Number())),
  poster_path: t.Optional(t.Nullable(t.String())),
  backdrop_path: t.Optional(t.Nullable(t.String())),
  vote_average: t.Optional(t.Number()),
  vote_count: t.Optional(t.Number()),
  popularity: t.Optional(t.Number()),
  genre_ids: t.Optional(t.Array(t.Number())),
});

const activityItem = t.Object({
  id: t.String(),
  kind: t.Union([t.Literal("media"), t.Literal("episode")]),
  created_at: t.String(),
  rating: t.Nullable(t.Number()),
  review_title: t.Nullable(t.String()),
  comment: t.Nullable(t.String()),
  media_title: t.String(),
  media_subtitle: t.String(),
  poster_path: t.Nullable(t.String()),
  media_type: mediaType,
  tmdb_id: t.Number(),
  season_number: t.Optional(t.Nullable(t.Number())),
  episode_number: t.Optional(t.Nullable(t.Number())),
  episode_tmdb_id: t.Optional(t.Nullable(t.Number())),
  author: profileCard,
});

const watchlistItem = t.Object({
  id: t.String(),
  tmdb_id: t.Number(),
  media_type: mediaType,
  added_at: t.String(),
  visibility: t.Union([t.Literal("private"), t.Literal("followers"), t.Literal("public")]),
  media: mediaSummary,
});

const followRequest = t.Object({
  id: t.String(),
  created_at: t.String(),
  status: t.Union([t.Literal("pending"), t.Literal("approved"), t.Literal("rejected")]),
  requester: profileCard,
});

const pageQuery = t.Object({
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export const SocialModel = new Elysia({ name: "Social.Model" }).model({
  "social.ProfileCard": profileCard,
  "social.Profile": profile,
  "social.ProfileList": t.Array(profileCard),
  "social.SearchQuery": t.Object({
    q: t.String({ minLength: 1, maxLength: 60 }),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    offset: t.Optional(t.Numeric({ minimum: 0 })),
  }),
  "social.PageQuery": pageQuery,
  "social.ActivityList": t.Array(activityItem),
  "social.WatchlistPage": t.Object({
    items: t.Array(watchlistItem),
    count: t.Number(),
  }),
  "social.FollowResult": t.Object({
    state: t.Union([t.Literal("following"), t.Literal("requested")]),
    profile,
  }),
  "social.UnfollowResult": t.Object({
    profile,
  }),
  "social.RequestList": t.Array(followRequest),
  "social.ApproveAllResponse": t.Object({
    approved: t.Number(),
  }),
  "social.OkResponse": t.Object({
    ok: t.Boolean(),
  }),
  "social.ContactMatchList": t.Array(
    t.Object({
      profile: profileCard,
      matched_hashes: t.Array(t.String()),
    }),
  ),
  "social.ContactsMatchBody": t.Object({
    identifiers: t.Array(
      t.Object({
        kind: t.Union([t.Literal("email"), t.Literal("phone")]),
        hash: t.String({ minLength: 16, maxLength: 128 }),
      }),
      { maxItems: 2000 },
    ),
  }),
});

export const socialModels = SocialModel.models;
