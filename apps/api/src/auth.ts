import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { db } from "@seen/db";
import * as schema from "@seen/db/schema";
import { betterAuth } from "better-auth";
import { ulid } from "ulid";

import { env } from "./env";

const socialProviders =
  env.appleClientId && env.appleClientSecret
    ? {
        apple: {
          clientId: env.appleClientId,
          clientSecret: env.appleClientSecret,
        },
      }
    : undefined;

export const auth = betterAuth({
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  trustedOrigins: env.trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  plugins: [expo()],
  experimental: {
    joins: true,
  },
  advanced: {
    database: {
      generateId: () => ulid(),
    },
  },
  user: {
    additionalFields: {
      userMetadata: {
        type: "json",
        required: false,
        input: false,
      },
      appMetadata: {
        type: "json",
        required: false,
        input: false,
      },
      invitedAt: {
        type: "date",
        required: false,
        input: false,
      },
      lastSignInAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
});
