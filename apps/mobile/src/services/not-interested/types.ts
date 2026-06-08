import type { MediaType } from "@/lib/tmdb";

export interface NotInterestedItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  reason: string | null;
  created_at: string;
}

export interface NotInterestedInput {
  tmdb_id: number;
  media_type: MediaType;
  reason?: string;
}
