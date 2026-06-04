import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { ReviewsListView } from "@/components/screens/reviews-list-view";
import { usePaginatedMediaReviews } from "@/hooks/reviews/use-media-reviews";
import type { MediaType } from "@/lib/tmdb";

export function ReviewsListSheet() {
  const params = useLocalSearchParams<{
    id: string;
    mediaType?: MediaType;
    title?: string;
  }>();
  const { t } = useTranslation();
  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";
  const title = params.title ?? t("mediaDetail.allReviews");

  const state = usePaginatedMediaReviews(Number(params.id), mediaType);

  return <ReviewsListView title={title} {...state} />;
}
