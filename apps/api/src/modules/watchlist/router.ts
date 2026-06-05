import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { addToWatchlist, removeFromWatchlist } from "./mutations";
import { WatchlistModel } from "./model";
import { getMyWatchlistItem, getMyWatchlistPage } from "./queries";

export const watchlistController = new Elysia({
  name: "Watchlist.Controller",
  prefix: "/watchlist",
})
  .use(authGuard)
  .use(WatchlistModel)
  .get("/my", ({ user, query }) => getMyWatchlistItem(user.id, query.tmdbId, query.mediaType), {
    auth: true,
    query: "watchlist.MediaRefQuery",
    response: {
      200: "watchlist.NullableItem",
    },
  })
  .put("/my", ({ user, body }) => addToWatchlist(user.id, body), {
    auth: true,
    body: "watchlist.Input",
    response: {
      200: "watchlist.Item",
    },
  })
  .delete(
    "/my",
    async ({ user, query }) => {
      await removeFromWatchlist(user.id, query.tmdbId, query.mediaType);
      return { ok: true };
    },
    {
      auth: true,
      query: "watchlist.MediaRefQuery",
      response: {
        200: "watchlist.DeleteResponse",
      },
    },
  )
  .get(
    "/",
    ({ user, query }) =>
      getMyWatchlistPage(user.id, query.mediaType, query.search, query.limit, query.offset),
    {
      auth: true,
      query: "watchlist.ListQuery",
      response: {
        200: "watchlist.Page",
      },
    },
  );
