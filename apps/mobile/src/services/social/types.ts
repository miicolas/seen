import type { MediaType, TmdbMovieSummary } from "@/lib/tmdb";

export type FollowRequestStatus = "none" | "pending" | "rejected";
export type FollowPolicy = "open" | "approval_required";
export type ProfileVisibility = "public" | "followers";
export type WatchlistVisibility = "private" | "followers" | "public";

export interface MutualFollower {
  id: string;
  full_name: string;
}

export interface SocialProfileCard {
  id: string;
  username: string;
  full_name: string;
  avatar_path: string | null;
  is_me: boolean;
  is_following: boolean;
  follows_me: boolean;
  request_status: FollowRequestStatus;
  // Social context, present on list/search/detail responses.
  followers_count?: number;
  seen_count?: number;
  mutual_followers?: MutualFollower[];
  mutual_followers_count?: number;
}

export interface SocialProfile extends SocialProfileCard {
  follow_policy: FollowPolicy;
  profile_visibility: ProfileVisibility;
  followers_count: number;
  following_count: number;
  locked: boolean;
}

export interface SocialActivityItem {
  id: string;
  kind: "media" | "episode";
  created_at: string;
  rating: number | null;
  review_title: string | null;
  comment: string | null;
  media_title: string;
  media_subtitle: string;
  poster_path: string | null;
  media_type: MediaType;
  tmdb_id: number;
  season_number: number | null;
  episode_number: number | null;
  episode_tmdb_id: number | null;
  author: SocialProfileCard;
}

export interface SocialWatchlistItem {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  added_at: string;
  visibility: WatchlistVisibility;
  media: TmdbMovieSummary;
}

export interface SocialWatchlistPage {
  items: SocialWatchlistItem[];
  count: number;
}

export interface FollowRequest {
  id: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  requester: SocialProfileCard;
}

export interface FollowResult {
  state: "following" | "requested";
  profile: SocialProfile;
}

export type ContactIdentifierKind = "email" | "phone";

export interface ContactIdentifierHash {
  kind: ContactIdentifierKind;
  hash: string;
}

// A local contact paired with the hashes we derive from it, so matched profiles
// can be re-joined to the on-device contact name without the server ever seeing
// plaintext.
export interface LocalContact {
  name: string;
  identifiers: ContactIdentifierHash[];
}

export interface ContactMatch {
  profile: SocialProfileCard;
  contactName: string | null;
}
