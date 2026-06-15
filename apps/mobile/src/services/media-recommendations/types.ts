export type RecommendationProfileCard = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_path: string | null;
};

export type ReceivedRecommendation = {
  id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  message: string | null;
  read_at: string | null;
  created_at: string;
  sender: RecommendationProfileCard;
};

export type SendRecommendationInput = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path?: string | null;
  recipient_ids: string[];
  message?: string | null;
};
