import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { NotInterestedModel } from "./model";
import { dismiss, undismiss } from "./mutations";
import { getMyItem, listMyItems } from "./queries";

export const notInterestedController = new Elysia({
  name: "NotInterested.Controller",
  prefix: "/not-interested",
})
  .use(authGuard)
  .use(NotInterestedModel)
  .get("/my", ({ user, query }) => getMyItem(user.id, query.tmdbId, query.mediaType), {
    auth: true,
    query: "not-interested.MediaRefQuery",
    response: {
      200: "not-interested.NullableItem",
    },
  })
  .put("/my", ({ user, body }) => dismiss(user.id, body), {
    auth: true,
    body: "not-interested.Input",
    response: {
      200: "not-interested.Item",
    },
  })
  .delete(
    "/my",
    async ({ user, query }) => {
      await undismiss(user.id, query.tmdbId, query.mediaType);
      return { ok: true };
    },
    {
      auth: true,
      query: "not-interested.MediaRefQuery",
      response: {
        200: "not-interested.DeleteResponse",
      },
    },
  )
  .get("/", ({ user }) => listMyItems(user.id), {
    auth: true,
    response: {
      200: "not-interested.List",
    },
  });
