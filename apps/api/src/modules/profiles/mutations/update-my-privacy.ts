import { db } from "@seen/db";
import { profileContactIdentifiers, profiles } from "@seen/db/schema";
import { and, eq, ne } from "@seen/db/orm";

import { hashContactValue } from "../../../lib/contact-hash";
import { HttpError } from "../../../lib/http-error";
import { toApiRow } from "../../../lib/rows";
import { getOrCreateMyProfile } from "../queries/get-or-create-my-profile";

type AuthUser = {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
  name?: string | null;
  image?: string | null;
  userMetadata?: Record<string, unknown> | null;
};

type PrivacyInput = {
  followPolicy?: "open" | "approval_required";
  profileVisibility?: "public" | "followers";
  defaultWatchlistVisibility?: "private" | "followers" | "public";
  contactDiscoveryEnabled?: boolean;
};

// Reconcile the user's stored contact identifiers with their discovery setting.
// When discovery is on we store the salted hash of their verified email (and only
// that hash); when off we remove every identifier so they're no longer matchable.
async function syncContactIdentifiers(user: AuthUser, discoveryEnabled: boolean) {
  if (!discoveryEnabled) {
    await db.delete(profileContactIdentifiers).where(eq(profileContactIdentifiers.userId, user.id));
    return;
  }

  const emailHash = user.emailVerified && user.email ? hashContactValue("email", user.email) : null;
  if (!emailHash) {
    // Nothing verifiable to store yet; clear any stale rows.
    await db.delete(profileContactIdentifiers).where(eq(profileContactIdentifiers.userId, user.id));
    return;
  }

  await db
    .insert(profileContactIdentifiers)
    .values({ userId: user.id, kind: "email", hash: emailHash })
    .onConflictDoNothing({
      target: [
        profileContactIdentifiers.userId,
        profileContactIdentifiers.kind,
        profileContactIdentifiers.hash,
      ],
    });
  // Drop any previously stored email hash that no longer matches (e.g. email changed).
  await db
    .delete(profileContactIdentifiers)
    .where(
      and(
        eq(profileContactIdentifiers.userId, user.id),
        eq(profileContactIdentifiers.kind, "email"),
        ne(profileContactIdentifiers.hash, emailHash),
      ),
    );
}

export async function updateMyPrivacy(user: AuthUser, input: PrivacyInput) {
  // Guarantee the profile row exists before patching it.
  await getOrCreateMyProfile(user);

  const patch: Partial<typeof profiles.$inferInsert> = {};
  if (input.followPolicy !== undefined) patch.followPolicy = input.followPolicy;
  if (input.profileVisibility !== undefined) patch.profileVisibility = input.profileVisibility;
  if (input.defaultWatchlistVisibility !== undefined) {
    patch.defaultWatchlistVisibility = input.defaultWatchlistVisibility;
  }
  if (input.contactDiscoveryEnabled !== undefined) {
    patch.contactDiscoveryEnabled = input.contactDiscoveryEnabled;
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date();
    await db.update(profiles).set(patch).where(eq(profiles.id, user.id));
  }

  const [row] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!row) throw new HttpError(404, "Profile not found.", "profile-not-found");

  if (input.contactDiscoveryEnabled !== undefined) {
    await syncContactIdentifiers(user, row.contactDiscoveryEnabled);
  }

  return toApiRow(row);
}
