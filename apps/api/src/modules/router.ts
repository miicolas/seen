import { Elysia } from "elysia";

import { accountController } from "./account";
import { episodeReviewController } from "./episode-reviews";
import { eventsController } from "./events";
import { importController } from "./import";
import { profileController } from "./profiles";
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
  .use(episodeReviewController)
  .use(eventsController)
  .use(importController)
  .use(accountController)
  .use(whatsNewController);
