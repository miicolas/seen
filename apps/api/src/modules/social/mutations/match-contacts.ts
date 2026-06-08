import { db } from "@seen/db";
import { profileContactIdentifiers, profiles } from "@seen/db/schema";
import { and, eq, inArray, ne, or } from "@seen/db/orm";

import { assertRateLimit } from "../../../lib/rate-limit";
import { buildProfileCards, type ProfileRow } from "../shared";

type Identifier = { kind: "email" | "phone"; hash: string };

const MATCH_CONTACTS_LIMIT = 30;
const MATCH_CONTACTS_WINDOW_SECONDS = 60 * 60;

// Match a batch of hashed contact identifiers against discoverable profiles. Only
// profiles that opted into contact discovery are returned, and the viewer is
// excluded. We receive (and return) only hashes — never plaintext contacts. Each
// result echoes the hashes that matched so the client can re-join the profile to
// the on-device contact name.
export async function matchContacts(viewerId: string, identifiers: Identifier[]) {
  await assertRateLimit({
    key: `contacts-match:${viewerId}`,
    max: MATCH_CONTACTS_LIMIT,
    windowSeconds: MATCH_CONTACTS_WINDOW_SECONDS,
    message: "Too many contact matching attempts. Please try again later.",
    code: "contacts-match-rate-limited",
  });

  const emailHashes = [
    ...new Set(identifiers.filter((id) => id.kind === "email").map((id) => id.hash)),
  ];
  const phoneHashes = [
    ...new Set(identifiers.filter((id) => id.kind === "phone").map((id) => id.hash)),
  ];
  if (emailHashes.length === 0 && phoneHashes.length === 0) return [];

  const hashMatch = or(
    emailHashes.length
      ? and(
          eq(profileContactIdentifiers.kind, "email"),
          inArray(profileContactIdentifiers.hash, emailHashes),
        )
      : undefined,
    phoneHashes.length
      ? and(
          eq(profileContactIdentifiers.kind, "phone"),
          inArray(profileContactIdentifiers.hash, phoneHashes),
        )
      : undefined,
  );

  const rows = await db
    .select({ profile: profiles, hash: profileContactIdentifiers.hash })
    .from(profileContactIdentifiers)
    .innerJoin(profiles, eq(profiles.id, profileContactIdentifiers.userId))
    .where(and(eq(profiles.contactDiscoveryEnabled, true), ne(profiles.id, viewerId), hashMatch));

  const byProfile = new Map<string, { row: ProfileRow; hashes: Set<string> }>();
  for (const row of rows) {
    let entry = byProfile.get(row.profile.id);
    if (!entry) {
      entry = { row: row.profile, hashes: new Set() };
      byProfile.set(row.profile.id, entry);
    }
    entry.hashes.add(row.hash);
  }

  const cards = await buildProfileCards(
    viewerId,
    [...byProfile.values()].map((entry) => entry.row),
  );

  return cards.map((card) => ({
    profile: card,
    matched_hashes: [...(byProfile.get(card.id)?.hashes ?? [])],
  }));
}
