import { Elysia, t } from "elysia";

const profileCard = t.Object({
  user_id: t.String(),
  username: t.Nullable(t.String()),
  full_name: t.Nullable(t.String()),
  avatar_path: t.Nullable(t.String()),
});

const received = t.Object({
  id: t.String(),
  tmdb_id: t.Number(),
  media_type: t.String(),
  title: t.String(),
  poster_path: t.Nullable(t.String()),
  message: t.Nullable(t.String()),
  read_at: t.Nullable(t.String()),
  created_at: t.String(),
  sender: profileCard,
});

export const MediaRecommendationModel = new Elysia({
  name: "MediaRecommendation.Model",
}).model({
  "mediaRecommendations.SendInput": t.Object({
    tmdb_id: t.Number(),
    media_type: t.Union([t.Literal("movie"), t.Literal("tv")]),
    title: t.String({ minLength: 1 }),
    poster_path: t.Optional(t.Nullable(t.String())),
    recipient_ids: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
    message: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
  }),
  "mediaRecommendations.SendResult": t.Object({
    ok: t.Boolean(),
    count: t.Number(),
  }),
  "mediaRecommendations.Received": received,
  "mediaRecommendations.ReceivedList": t.Array(received),
  "mediaRecommendations.FriendList": t.Array(profileCard),
  "mediaRecommendations.UnreadCount": t.Object({
    count: t.Number(),
  }),
  "mediaRecommendations.OkResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const mediaRecommendationModels = MediaRecommendationModel.models;

export type RecommendationProfileCardDto = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_path: string | null;
};

export type ReceivedRecommendationDto = {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  message: string | null;
  read_at: string | null;
  created_at: string;
  sender: RecommendationProfileCardDto;
};
