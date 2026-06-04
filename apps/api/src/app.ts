import { cors } from "@elysia/cors";
import { Elysia } from "elysia";

import { betterAuthRoutes } from "./auth-plugin";
import { env } from "./env";
import { HttpError } from "./lib/http-error";
import { episodeReviewController } from "./modules/episode-reviews";
import { profileController } from "./modules/profiles";
import { reviewController } from "./modules/reviews";
import { tmdbController } from "./modules/tmdb";

export const app = new Elysia()
  .use(
    cors({
      origin: env.trustedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  )
  .use(betterAuthRoutes)
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { error: error.message, code: error.code };
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      set.status = 409;
      return { error: "Conflict", code: "conflict" };
    }

    console.error(error);
  })
  .get("/health", () => ({ ok: true }))
  .use(tmdbController)
  .use(profileController)
  .use(reviewController)
  .use(episodeReviewController);

export type App = typeof app;
