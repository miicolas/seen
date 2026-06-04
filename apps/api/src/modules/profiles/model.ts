import { Elysia, t } from "elysia";

const mediaType = t.Union([t.Literal("movie"), t.Literal("tv")]);

const profile = t.Object({
  id: t.String(),
  full_name: t.String(),
  username: t.String(),
  avatar_path: t.Nullable(t.String()),
  created_at: t.String(),
  updated_at: t.String(),
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
});

export const ProfileModel = new Elysia({ name: "Profile.Model" }).model({
  "profile.Profile": profile,
  "profile.UpdateBody": t.Object({
    fullName: t.String({ minLength: 1 }),
    username: t.String({ minLength: 3, maxLength: 20, pattern: "^[a-z0-9_.]+$" }),
    avatarPath: t.Optional(t.Nullable(t.String())),
  }),
  "profile.ActivityQuery": t.Object({
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
  }),
  "profile.ActivityList": t.Array(activityItem),
  "profile.AvatarQuery": t.Object({
    path: t.String({ minLength: 1 }),
  }),
  "profile.AvatarUploadBody": t.Object({
    file: t.File({
      type: "image/*",
      maxSize: "5m",
    }),
  }),
  "profile.AvatarUploadResponse": t.Object({
    path: t.String(),
  }),
  "profile.DeleteResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const profileModels = ProfileModel.models;
