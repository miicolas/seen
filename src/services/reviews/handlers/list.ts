import { supabase } from "@/lib/supabase";

import type {
  MediaRef,
  MovieReviewsPage,
  PaginatedMediaRef,
  Review,
} from "../types";

export async function getMovieReviewsPage({
  tmdbId,
  mediaType,
  limit,
  offset,
}: PaginatedMediaRef): Promise<MovieReviewsPage> {
  const from = Math.max(0, offset);
  const pageSize = Math.max(1, limit);
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { reviews: (data ?? []) as Review[], count: count ?? 0 };
}

export async function getMovieReviews({
  tmdbId,
  mediaType,
}: MediaRef): Promise<Review[]> {
  const page = await getMovieReviewsPage({
    tmdbId,
    mediaType,
    limit: 3,
    offset: 0,
  });
  return page.reviews;
}

export async function getMovieReviewRatings({
  tmdbId,
  mediaType,
}: MediaRef): Promise<number[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .not("rating", "is", null);
  if (error) throw error;
  return (data ?? []).map((row) => Number(row.rating));
}
