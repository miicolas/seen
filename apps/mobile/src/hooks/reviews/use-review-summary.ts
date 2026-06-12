import { reviewKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import type { MediaType } from "@/lib/tmdb";
import { getReviewSummary, type MediaReviewStats, type Review } from "@/services/reviews";

// Review mutations invalidate this cache themselves, so it can stay fresh for
// a long time instead of being refetched on every screen focus.
const SUMMARY_STALE_TIME = 1000 * 60 * 30;

interface ReviewSummaryState {
  myReview: Review | null;
  reviews: Review[];
  count: number;
  stats: MediaReviewStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useReviewSummary(tmdbId: number, mediaType: MediaType): ReviewSummaryState {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: reviewKeys.summary(mediaType, tmdbId),
    queryFn: () => getReviewSummary({ tmdbId, mediaType }),
    enabled: !!user && Number.isFinite(tmdbId) && tmdbId > 0,
    staleTime: SUMMARY_STALE_TIME,
  });

  return {
    myReview: query.data?.my_review ?? null,
    reviews: query.data?.reviews ?? [],
    count: query.data?.count ?? 0,
    stats: query.data?.stats ?? null,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Failed to load reviews") : null,
  };
}
