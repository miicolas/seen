import { supabase } from "@/lib/supabase";
import { getMovieDetail } from "@/lib/tmdb";

import { currentUserId } from "../current-user";
import type { Review, ReviewInput } from "../types";

// Create or update the current user's review for a movie. The movie must exist
// in the `movies` cache first (reviews_movie_fkey); getMovieDetail upserts it —
// a cache hit when the detail screen already loaded it, so awaiting is cheap and
// removes the FK race deterministically.
export async function upsertReview(input: ReviewInput): Promise<Review> {
  const user_id = await currentUserId();
  await getMovieDetail(input.tmdb_id, input.media_type);

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id,
        tmdb_id: input.tmdb_id,
        media_type: input.media_type,
        rating: input.rating ?? null,
        comment: input.comment ?? null,
      },
      { onConflict: "user_id,tmdb_id,media_type" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}
