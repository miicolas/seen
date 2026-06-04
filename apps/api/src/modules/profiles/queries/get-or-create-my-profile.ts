import { db } from "@seen/db";
import { profiles } from "@seen/db/schema";
import { eq } from "drizzle-orm";

import { toApiRow } from "../../../lib/rows";
import { isUniqueViolation } from "../shared";

type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  userMetadata?: Record<string, unknown> | null;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function defaultFullName(user: AuthUser) {
  const metadata = user.userMetadata;
  return (
    stringValue(metadata?.full_name) ??
    stringValue(metadata?.name) ??
    stringValue(user.name) ??
    stringValue(user.email?.split("@")[0]) ??
    "User"
  );
}

function sanitizedUsernameBase(user: AuthUser) {
  const source = user.email?.split("@")[0] ?? user.name ?? "user";
  const sanitized = source
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "");

  return (sanitized.length >= 3 ? sanitized : "user").slice(0, 20);
}

function defaultUsername(user: AuthUser, withSuffix = false) {
  const base = sanitizedUsernameBase(user);
  if (!withSuffix) return base;

  const suffix = `_${user.id.replaceAll("-", "").slice(0, 6)}`;
  return `${base.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`;
}

export async function getOrCreateMyProfile(user: AuthUser) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (existing) return toApiRow(existing);

  const input = {
    id: user.id,
    fullName: defaultFullName(user),
    username: defaultUsername(user),
  };

  const insertProfile = (username: string) =>
    db
      .insert(profiles)
      .values({ ...input, username })
      .returning();

  try {
    const [created] = await insertProfile(input.username);
    return toApiRow(created);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  const [retried] = await insertProfile(defaultUsername(user, true));
  return toApiRow(retried);
}
