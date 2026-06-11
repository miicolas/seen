export type WatchParticipantStatus = "active" | "paused" | "completed" | "abandoned";

export type WatchParticipant = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_path: string | null;
  role: "host" | "guest";
  status: WatchParticipantStatus;
  position_seconds: number;
  duration_seconds: number;
  last_progress_at: string;
  started_at: string;
  completed_at: string | null;
};

export type WatchSession = {
  id: string;
  host_id: string;
  media_type: "movie" | "episode";
  tmdb_id: number;
  season_number: number | null;
  episode_number: number | null;
  episode_tmdb_id: number | null;
  title: string;
  poster_path: string | null;
  duration_seconds: number;
  status: "active" | "completed" | "canceled";
  created_at: string;
  watching_with?: string | null;
  me: WatchParticipant;
};

export type WatchProfileCard = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_path: string | null;
};

export type WatchSessionDetail = Omit<WatchSession, "me"> & {
  me: WatchParticipant | null;
  participants: WatchParticipant[];
  pending_invitations: {
    id: string;
    status: string;
    expires_at: string;
    invitee: WatchProfileCard;
  }[];
};

export type WatchInvitation = {
  id: string;
  session_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  inviter: WatchProfileCard;
  session: {
    media_type: "movie" | "episode";
    tmdb_id: number;
    season_number: number | null;
    episode_number: number | null;
    title: string;
    poster_path: string | null;
    duration_seconds: number;
  };
};

export type StartWatchSessionInput = {
  media_type: "movie" | "episode";
  tmdb_id: number;
  season_number?: number;
  episode_number?: number;
  episode_tmdb_id?: number;
  duration_seconds?: number;
};
