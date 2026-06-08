import { Elysia } from "elysia";

import { accountController } from "./account";
import { episodeReviewController } from "./episode-reviews";
import { eventsController } from "./events";
import { importController } from "./import";
import { likesController } from "./likes";
import { notInterestedController } from "./not-interested";
import { platformsController } from "./platforms";
import { preferencesController } from "./preferences";
import { profileController } from "./profiles";
import { recommendationsController } from "./recommendations";
import { reviewController } from "./reviews";
import { tmdbController } from "./tmdb";
import { watchlistController } from "./watchlist";
import { whatsNewController } from "./whats-new";

// Root API router: routes to each feature router.
export const apiRouter = new Elysia({ name: "api.router" })
  .use(tmdbController)
  .use(profileController)
  .use(reviewController)
  .use(watchlistController)
  .use(likesController)
  .use(notInterestedController)
  .use(episodeReviewController)
  .use(eventsController)
  .use(importController)
  .use(accountController)
  .use(platformsController)
  .use(preferencesController)
  .use(recommendationsController)
  .use(whatsNewController);
