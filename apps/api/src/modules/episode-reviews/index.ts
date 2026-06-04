import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { EpisodeReviewModel } from "./model";
import {
  deleteEpisodeReview,
  getEpisodeReviewsPage,
  getEpisodeStats,
  getMyEpisodeReview,
  getMySeasonEpisodeRatings,
  getSeasonEpisodeStats,
  upsertEpisodeReview,
} from "./service";

export const episodeReviewController = new Elysia({
  name: "EpisodeReview.Controller",
  prefix: "/episode-reviews",
})
  .use(authGuard)
  .use(EpisodeReviewModel)
  .get(
    "/my",
    ({ user, query }) => getMyEpisodeReview(user.id, query),
    {
      auth: true,
      query: "episodeReview.RefQuery",
      response: {
        200: "episodeReview.NullableReview",
      },
    },
  )
  .put(
    "/my",
    ({ user, body }) => upsertEpisodeReview(user.id, body),
    {
      auth: true,
      body: "episodeReview.Input",
      response: {
        200: "episodeReview.Review",
      },
    },
  )
  .delete(
    "/my",
    async ({ user, query }) => {
      await deleteEpisodeReview(user.id, query);
      return { ok: true };
    },
    {
      auth: true,
      query: "episodeReview.RefQuery",
      response: {
        200: "episodeReview.DeleteResponse",
      },
    },
  )
  .get(
    "/",
    ({ query }) =>
      getEpisodeReviewsPage(
        query,
        query.limit,
        query.offset,
      ),
    {
      query: "episodeReview.ListQuery",
      response: {
        200: "episodeReview.Page",
      },
    },
  )
  .get(
    "/stats",
    ({ query }) => getEpisodeStats(query),
    {
      query: "episodeReview.RefQuery",
      response: {
        200: "episodeReview.Stats",
      },
    },
  )
  .get(
    "/season/stats",
    ({ query }) => getSeasonEpisodeStats(query.seriesTmdbId, query.seasonNumber),
    {
      query: "episodeReview.SeasonQuery",
      response: {
        200: "episodeReview.SeasonStatList",
      },
    },
  )
  .get(
    "/season/my",
    ({ user, query }) =>
      getMySeasonEpisodeRatings(user.id, query.seriesTmdbId, query.seasonNumber),
    {
      auth: true,
      query: "episodeReview.SeasonQuery",
      response: {
        200: "episodeReview.MySeasonRatingList",
      },
    },
  );
