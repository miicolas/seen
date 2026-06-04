import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { db } from "@seen/db";
import * as schema from "@seen/db/schema";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { SignJWT, importPKCS8 } from "jose";
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

// Apple requires the OAuth `clientSecret` to be a short-lived ES256 JWT signed
// with the .p8 key (max 6 months). Regenerated on each server boot.
async function generateAppleClientSecret(
  clientId: string,
  teamId: string,
  keyId: string,
  privateKey: string,
) {
  // Env files store the .p8 contents with escaped newlines; restore them.
  const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

const appleEnabled =
  env.appleClientId &&
  env.appleTeamId &&
  env.appleKeyId &&
  env.applePrivateKey;

const socialProviders = appleEnabled
  ? {
      apple: {
        clientId: env.appleClientId!,
        clientSecret: await generateAppleClientSecret(
          env.appleClientId!,
          env.appleTeamId!,
          env.appleKeyId!,
          env.applePrivateKey!,
        ),
        // Native iOS sign-in sends an idToken whose `aud` is the app bundle ID
        // (not the Service ID). Better Auth needs this to accept that token.
        ...(env.appleBundleIdentifier
          ? { appBundleIdentifier: env.appleBundleIdentifier }
          : {}),
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
