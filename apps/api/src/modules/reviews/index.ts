import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { ReviewModel } from "./model";
import {
  assertReviewInput,
  deleteReview,
  getMediaReviewsPage,
  getMediaStats,
  getMyReview,
  upsertReview,
} from "./service";

export const reviewController = new Elysia({
  name: "Review.Controller",
  prefix: "/reviews",
})
  .use(authGuard)
  .use(ReviewModel)
  .get(
    "/my",
    ({ user, query }) => getMyReview(user.id, query.tmdbId, query.mediaType),
    {
      auth: true,
      query: "review.MediaRefQuery",
      response: {
        200: "review.NullableReview",
      },
    },
  )
  .put(
    "/my",
    ({ user, body }) => {
      assertReviewInput(body);
      return upsertReview(user.id, body);
    },
    {
      auth: true,
      body: "review.Input",
      response: {
        200: "review.Review",
      },
    },
  )
  .delete(
    "/my",
    async ({ user, query }) => {
      await deleteReview(user.id, query.tmdbId, query.mediaType);
      return { ok: true };
    },
    {
      auth: true,
      query: "review.MediaRefQuery",
      response: {
        200: "review.DeleteResponse",
      },
    },
  )
  .get(
    "/",
    ({ query }) =>
      getMediaReviewsPage(
        query.tmdbId,
        query.mediaType,
        query.limit,
        query.offset,
      ),
    {
      query: "review.ListQuery",
      response: {
        200: "review.Page",
      },
    },
  )
  .get(
    "/stats",
    ({ query }) => getMediaStats(query.tmdbId, query.mediaType),
    {
      query: "review.MediaRefQuery",
      response: {
        200: "review.Stats",
      },
    },
  );
