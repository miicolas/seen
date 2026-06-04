import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  usePaginatedReviews,
  type PaginatedReviewsState,
} from "@/hooks/reviews/use-paginated-reviews";
import {
  getEpisodeReviewsPage,
  type EpisodeRef,
  type EpisodeReview,
  type EpisodeReviewsPage,
} from "@/services/episode-reviews";

const REVIEW_PREVIEW_LIMIT = 3;
export const EPISODE_REVIEW_PAGE_SIZE = 25;

interface EpisodeReviewPreviewState {
  reviews: EpisodeReview[];
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function emptyPage(): EpisodeReviewsPage {
  return { reviews: [], count: 0 };
}

function canLoad(ref: EpisodeRef): boolean {
  return (
    Number.isFinite(ref.seriesTmdbId) &&
    ref.seriesTmdbId > 0 &&
    Number.isFinite(ref.seasonNumber) &&
    Number.isFinite(ref.episodeNumber) &&
    ref.episodeNumber > 0
  );
}

export function useEpisodeReviewPreview(
  ref: EpisodeRef,
): EpisodeReviewPreviewState {
  const { data, isLoading, error, refetch } =
    useAsyncResource<EpisodeReviewsPage>(
      () =>
        canLoad(ref)
          ? getEpisodeReviewsPage({ ...ref, limit: REVIEW_PREVIEW_LIMIT, offset: 0 })
          : Promise.resolve(emptyPage()),
      [ref.seriesTmdbId, ref.seasonNumber, ref.episodeNumber],
      emptyPage(),
      "Failed to load reviews",
    );

  return { reviews: data.reviews, count: data.count, isLoading, error, refetch };
}

export function usePaginatedEpisodeReviews(
  ref: EpisodeRef,
): PaginatedReviewsState<EpisodeReview> {
  const { seriesTmdbId, seasonNumber, episodeNumber } = ref;
  return usePaginatedReviews<EpisodeReview>(
    (offset, limit) =>
      getEpisodeReviewsPage({
        seriesTmdbId,
        seasonNumber,
        episodeNumber,
        limit,
        offset,
      }),
    EPISODE_REVIEW_PAGE_SIZE,
    canLoad(ref),
    `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`,
  );
}
