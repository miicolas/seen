import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { LikesModel } from "./model";
import { addLike, removeLike } from "./mutations";
import { getMyLikes, getMyLikesPage } from "./queries";

export const likesController = new Elysia({
  name: "Likes.Controller",
  prefix: "/likes",
})
  .use(authGuard)
  .use(LikesModel)
  .get("/my", ({ user, query }) => getMyLikes(user.id, query.tmdbId, query.mediaType), {
    auth: true,
    query: "likes.MediaRefQuery",
    response: {
      200: "likes.Membership",
    },
  })
  .put("/my", ({ user, body }) => addLike(user.id, body), {
    auth: true,
    body: "likes.Input",
    response: {
      200: "likes.Item",
    },
  })
  .delete(
    "/my",
    async ({ user, query }) => {
      await removeLike(user.id, query.tmdbId, query.mediaType, query.kind);
      return { ok: true };
    },
    {
      auth: true,
      query: "likes.DeleteQuery",
      response: {
        200: "likes.DeleteResponse",
      },
    },
  )
  .get(
    "/",
    ({ user, query }) =>
      getMyLikesPage(user.id, query.kind, query.mediaType, query.limit, query.offset),
    {
      auth: true,
      query: "likes.ListQuery",
      response: {
        200: "likes.Page",
      },
    },
  );
