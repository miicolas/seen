import { eden, unwrapEden } from "@/lib/eden";

import type {
  ContactIdentifierHash,
  ContactMatch,
  LocalContact,
  SocialProfileCard,
} from "../types";

// The server caps a match request at 2000 identifiers; mirror that here.
const MAX_IDENTIFIERS = 2000;

type MatchEntry = { profile: SocialProfileCard; matched_hashes: string[] };

// Hash-match local contacts against Seen profiles. We send only hashes; the
// returned `matched_hashes` let us re-join each profile to the local contact name
// entirely on-device.
export async function matchContacts(contacts: LocalContact[]): Promise<ContactMatch[]> {
  const nameByHash = new Map<string, string>();
  const identifiers: ContactIdentifierHash[] = [];
  const seen = new Set<string>();

  for (const contact of contacts) {
    for (const identifier of contact.identifiers) {
      if (!nameByHash.has(identifier.hash)) nameByHash.set(identifier.hash, contact.name);
      const key = `${identifier.kind}:${identifier.hash}`;
      if (seen.has(key)) continue;
      seen.add(key);
      identifiers.push(identifier);
    }
  }
  if (identifiers.length === 0) return [];

  const matches = await unwrapEden<MatchEntry[]>(
    eden.social.contacts.match.post({ identifiers: identifiers.slice(0, MAX_IDENTIFIERS) }),
  );

  return matches.map((entry) => ({
    profile: entry.profile,
    contactName: entry.matched_hashes.map((hash) => nameByHash.get(hash)).find(Boolean) ?? null,
  }));
}
