import { supabase } from "@/lib/supabase";
import type { MediaType } from "@/lib/tmdb";
import { currentUserId } from "@/services/core";

import type { ProfileActivityItem } from "../types";

type MovieRow = {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  release_date: string | null;
};

type ReviewRow = {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  rating: number | null;
  title: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type EpisodeReviewRow = {
  id: string;
  user_id: string;
  series_tmdb_id: number;
  episode_tmdb_id: number;
  season_number: number;
  episode_number: number;
  rating: number | null;
  title: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

async function getMoviesForActivity(
  keys: { tmdbId: number; mediaType: MediaType }[],
) {
  const ids = [...new Set(keys.map((key) => key.tmdbId))];
  if (ids.length === 0) return new Map<string, MovieRow>();

  const { data, error } = await supabase
    .from("movies")
    .select("tmdb_id, media_type, title, poster_path, release_date")
    .in("tmdb_id", ids);

  if (error) throw error;

  return new Map(
    ((data ?? []) as MovieRow[]).map((movie) => [
      `${movie.tmdb_id}:${movie.media_type}`,
      movie,
    ]),
  );
}

function mediaSubtitle(movie: MovieRow | undefined, mediaType: MediaType) {
  const label = mediaType === "tv" ? "Series" : "Movie";
  const year = movie?.release_date?.slice(0, 4);
  return year ? `${label} • ${year}` : label;
}

export async function getMyProfileActivity(
  limit = 12,
): Promise<ProfileActivityItem[]> {
  const userId = await currentUserId();
  const pageSize = Math.max(1, limit);

  const [reviewsResult, episodesResult] = await Promise.all([
    supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(pageSize),
    supabase
      .from("episode_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(pageSize),
  ]);

  if (reviewsResult.error) throw reviewsResult.error;
  if (episodesResult.error) throw episodesResult.error;

  const reviews = (reviewsResult.data ?? []) as ReviewRow[];
  const episodes = (episodesResult.data ?? []) as EpisodeReviewRow[];

  const movies = await getMoviesForActivity([
    ...reviews.map((review) => ({
      tmdbId: review.tmdb_id,
      mediaType: review.media_type,
    })),
    ...episodes.map((episode) => ({
      tmdbId: episode.series_tmdb_id,
      mediaType: "tv" as const,
    })),
  ]);

  const mediaItems: ProfileActivityItem[] = reviews.map((review) => {
    const movie = movies.get(`${review.tmdb_id}:${review.media_type}`);
    return {
      id: review.id,
      kind: "media",
      created_at: review.created_at,
      rating: review.rating,
      review_title: review.title,
      comment: review.comment,
      media_title:
        movie?.title ?? (review.media_type === "tv" ? "Series" : "Movie"),
      media_subtitle: mediaSubtitle(movie, review.media_type),
      poster_path: movie?.poster_path ?? null,
      media_type: review.media_type,
      tmdb_id: review.tmdb_id,
    };
  });

  const episodeItems: ProfileActivityItem[] = episodes.map((episode) => {
    const series = movies.get(`${episode.series_tmdb_id}:tv`);
    return {
      id: episode.id,
      kind: "episode",
      created_at: episode.created_at,
      rating: episode.rating,
      review_title: episode.title,
      comment: episode.comment,
      media_title: series?.title ?? "Series",
      media_subtitle: `Season ${episode.season_number} • Episode ${episode.episode_number}`,
      poster_path: series?.poster_path ?? null,
      media_type: "tv",
      tmdb_id: episode.series_tmdb_id,
    };
  });

  return [...mediaItems, ...episodeItems]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime(),
    )
    .slice(0, pageSize);
}
