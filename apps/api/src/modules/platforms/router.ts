import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { DEFAULT_REGION } from "../tmdb/client";
import { PlatformsModel } from "./model";
import { setUserPlatforms } from "./mutations";
import { getUserPlatforms, listProviders } from "./queries";

export const platformsController = new Elysia({
  name: "Platforms.Controller",
  prefix: "/platforms",
})
  .use(authGuard)
  .use(PlatformsModel)
  .get("/providers", ({ query }) => listProviders(query.region ?? DEFAULT_REGION), {
    query: "platforms.RegionQuery",
    response: {
      200: "platforms.ProviderList",
    },
  })
  .get("/me", ({ user, query }) => getUserPlatforms(user.id, query.region ?? DEFAULT_REGION), {
    auth: true,
    query: "platforms.RegionQuery",
    response: {
      200: "platforms.UserPlatforms",
    },
  })
  .put("/me", ({ user, body }) => setUserPlatforms(user.id, body), {
    auth: true,
    body: "platforms.SetUserPlatformsInput",
    response: {
      200: "platforms.UserPlatforms",
    },
  });
