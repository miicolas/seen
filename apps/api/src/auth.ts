import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { db } from "@seen/db";
import * as schema from "@seen/db/schema";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";

import { env } from "./env";
import { deleteAvatarObject } from "./lib/s3";

// Best-effort S3 cleanup before Better Auth deletes the user row. The user-row
// delete cascades to sessions/accounts/profile/reviews via FK; the stored avatar
// in S3 is the only thing the cascade can't reach, so we remove it here.
async function deleteUserAvatar(userId: string) {
  const [profile] = await db
    .select({ avatarPath: schema.profiles.avatarPath })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);

  if (!profile?.avatarPath) return;

  await deleteAvatarObject(userId, profile.avatarPath).catch((error) => {
    console.error("avatar cleanup on user delete failed", error);
  });
}

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
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await deleteUserAvatar(user.id);
      },
    },
  },
});
