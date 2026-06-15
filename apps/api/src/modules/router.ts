import { Elysia } from "elysia";

import { accountController } from "./account";
import { analyticsController } from "./analytics";
import { episodeReviewController } from "./episode-reviews";
import { eventsController } from "./events";
import { importController } from "./import";
import { libraryController } from "./library";
import { likesController } from "./likes";
import { mediaRecommendationController } from "./media-recommendations";
import { notInterestedController } from "./not-interested";
import { notificationController } from "./notifications";
import { platformsController } from "./platforms";
import { preferencesController } from "./preferences";
import { profileController } from "./profiles";
import { recommendationsController } from "./recommendations";
import { reviewController } from "./reviews";
import { socialController } from "./social";
import { tmdbController } from "./tmdb";
import { watchSessionController } from "./watch-sessions";
import { watchlistController } from "./watchlist";
import { whatsNewController } from "./whats-new";

// Root API router: routes to each feature router.
export const apiRouter = new Elysia({ name: "api.router" })
  .use(tmdbController)
  .use(profileController)
  .use(reviewController)
  .use(watchlistController)
  .use(likesController)
  .use(libraryController)
  .use(notInterestedController)
  .use(episodeReviewController)
  .use(eventsController)
  .use(importController)
  .use(accountController)
  .use(platformsController)
  .use(preferencesController)
  .use(recommendationsController)
  .use(socialController)
  .use(watchSessionController)
  .use(mediaRecommendationController)
  .use(notificationController)
  .use(analyticsController)
  .use(whatsNewController);
