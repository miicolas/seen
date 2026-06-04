import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { ReviewsListView } from "@/components/screens/reviews-list-view";
import { usePaginatedEpisodeReviews } from "@/hooks/reviews/use-episode-reviews";

export function EpisodeReviewsListSheet() {
  const params = useLocalSearchParams<{
    seriesId: string;
    seasonNumber: string;
    episodeNumber: string;
    title?: string;
  }>();
  const { t } = useTranslation();
  const title = params.title ?? t("mediaDetail.allReviews");

  const state = usePaginatedEpisodeReviews({
    seriesTmdbId: Number(params.seriesId),
    seasonNumber: Number(params.seasonNumber),
    episodeNumber: Number(params.episodeNumber),
  });

  return <ReviewsListView title={title} {...state} />;
}
