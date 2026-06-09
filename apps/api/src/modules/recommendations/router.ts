import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { DEFAULT_REGION } from "../tmdb/constants";
import { RecommendationsModel } from "./model";
import { getAvailableFeed } from "./queries";

export const recommendationsController = new Elysia({
  name: "Recommendations.Controller",
  prefix: "/recommendations",
})
  .use(authGuard)
  .use(RecommendationsModel)
  .get(
    "/available",
    ({ user, query }) =>
      getAvailableFeed(user.id, query.region ?? DEFAULT_REGION, query.filter ?? "all"),
    {
      auth: true,
      query: "recommendations.AvailableQuery",
      response: {
        200: "recommendations.AvailableList",
      },
    },
  );
