import { reviewKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import type { MediaType } from "@/lib/tmdb";
import { getMediaStats, type MediaReviewStats } from "@/services/reviews";

export function useMediaStats(tmdbId: number, mediaType: MediaType) {
  const query = useQuery({
    queryKey: reviewKeys.stats(mediaType, tmdbId),
    queryFn: () => getMediaStats({ tmdbId, mediaType }),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
  });

  return {
    stats: (query.data ?? null) as MediaReviewStats | null,
    refetch: query.refetch,
  };
}
