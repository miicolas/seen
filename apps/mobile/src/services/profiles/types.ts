import type { MediaType } from "@/lib/tmdb";

export type FollowPolicy = "open" | "approval_required";
export type ProfileVisibility = "public" | "followers";
export type WatchlistVisibility = "private" | "followers" | "public";

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_path: string | null;
  follow_policy: FollowPolicy;
  profile_visibility: ProfileVisibility;
  default_watchlist_visibility: WatchlistVisibility;
  contact_discovery_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrivacyInput {
  followPolicy?: FollowPolicy;
  profileVisibility?: ProfileVisibility;
  defaultWatchlistVisibility?: WatchlistVisibility;
  contactDiscoveryEnabled?: boolean;
}

export interface ProfileInput {
  fullName: string;
  username: string;
  avatarPath?: string | null;
}

export type ProfileErrorCode =
  | "full-name-required"
  | "username-invalid"
  | "username-taken"
  | "avatar-too-large"
  | "avatar-invalid-type"
  | "not-signed-in";

export class ProfileError extends Error {
  code: ProfileErrorCode;

  constructor(code: ProfileErrorCode, message: string) {
    super(message);
    this.name = "ProfileError";
    this.code = code;
  }
}

export interface AvatarUploadInput {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number;
}

export type ProfileActivityKind = "media" | "episode";

export interface ProfileActivityItem {
  id: string;
  kind: ProfileActivityKind;
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
}
