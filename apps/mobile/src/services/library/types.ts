import type { MediaType } from "@/lib/tmdb";

// Identifier pair as returned by GET /library/memberships (snake_case API shape).
export interface LibraryMediaRef {
  tmdb_id: number;
  media_type: MediaType;
}

export type MembershipSet = "watchlist" | "likes" | "favorites" | "not_interested";

export type LibraryMemberships = Record<MembershipSet, LibraryMediaRef[]>;
