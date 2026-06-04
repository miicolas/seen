import { Elysia } from "elysia";

import { accountController } from "./account";
import { episodeReviewController } from "./episode-reviews";
import { profileController } from "./profiles";
import { reviewController } from "./reviews";
import { tmdbController } from "./tmdb";

// Root API router: routes to each feature router.
export const apiRouter = new Elysia({ name: "api.router" })
  .use(tmdbController)
  .use(profileController)
  .use(reviewController)
  .use(episodeReviewController)
  .use(accountController);
