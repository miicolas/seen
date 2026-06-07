import { cors } from "@elysia/cors";
import { Elysia } from "elysia";

import { betterAuthRoutes } from "./auth-plugin";
import { env } from "./env";
import { HttpError } from "./lib/http-error";
import { apiRouter } from "./modules/router";

export const app = new Elysia()
  .use(
    cors({
      origin: env.trustedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      exposeHeaders: ["Content-Length", "Authorization", "Set-Cookie", "set-auth-token"],
    }),
  )
  .derive(() => ({
    startTime: performance.now(),
  }))
  .onAfterResponse(({ request, path, set, startTime }) => {
    const durationMs = Math.round(performance.now() - startTime);
    console.log(`${request.method} ${path} ${set.status ?? 200} - ${durationMs}ms`);
  })
  .use(betterAuthRoutes)
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { error: error.message, code: error.code };
    }

    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      set.status = 409;
      return { error: "Conflict", code: "conflict" };
    }

    console.error(error);
  })
  .get("/health", () => ({ ok: true }))
  .use(apiRouter);

export type App = typeof app;
