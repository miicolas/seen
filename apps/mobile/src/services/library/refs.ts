import type { MediaType } from "@/lib/tmdb";

import type { LibraryMediaRef, LibraryMemberships, MembershipSet } from "./types";

export const EMPTY_MEMBERSHIPS: LibraryMemberships = {
  watchlist: [],
  likes: [],
  favorites: [],
  not_interested: [],
};

const refKey = (tmdbId: number, mediaType: MediaType) => `${mediaType}:${tmdbId}`;

// Membership checks run per visible card (×4 sets), so derive lookup Sets once
// per payload object instead of scanning the arrays on every check. The cache
// is keyed by object identity; mutations produce new payloads, old ones get GC'd.
const keySetCache = new WeakMap<LibraryMemberships, Record<MembershipSet, Set<string>>>();

function keySetsOf(memberships: LibraryMemberships): Record<MembershipSet, Set<string>> {
  let sets = keySetCache.get(memberships);
  if (!sets) {
    sets = {
      watchlist: new Set(),
      likes: new Set(),
      favorites: new Set(),
      not_interested: new Set(),
    };
    for (const set of Object.keys(sets) as MembershipSet[]) {
      for (const ref of memberships[set]) sets[set].add(refKey(ref.tmdb_id, ref.media_type));
    }
    keySetCache.set(memberships, sets);
  }
  return sets;
}

export function hasMembership(
  memberships: LibraryMemberships,
  set: MembershipSet,
  tmdbId: number,
  mediaType: MediaType,
): boolean {
  return keySetsOf(memberships)[set].has(refKey(tmdbId, mediaType));
}

export function addMembership(
  memberships: LibraryMemberships,
  set: MembershipSet,
  ref: LibraryMediaRef,
): LibraryMemberships {
  if (hasMembership(memberships, set, ref.tmdb_id, ref.media_type)) return memberships;
  return { ...memberships, [set]: [...memberships[set], ref] };
}

export function removeMembership(
  memberships: LibraryMemberships,
  set: MembershipSet,
  ref: LibraryMediaRef,
): LibraryMemberships {
  return {
    ...memberships,
    [set]: memberships[set].filter(
      (existing) => existing.tmdb_id !== ref.tmdb_id || existing.media_type !== ref.media_type,
    ),
  };
}
