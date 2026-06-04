import { Elysia } from "elysia";

import { auth } from "./auth";

export const betterAuthRoutes = new Elysia({ name: "better-auth.routes" }).mount(
  auth.handler,
);

export const authGuard = new Elysia({ name: "better-auth.guard" }).macro({
    auth: {
      async resolve({ request: { headers }, status }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
