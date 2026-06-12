import type { MediaType } from "../../tmdb";
import { getMyReview } from "./get-my-review";
import { getMediaReviewsPage } from "./list";
import { getMediaStats } from "./stats";

const PREVIEW_LIMIT = 3;

// Everything the media detail screen needs about reviews, in one round trip.
export async function getMediaReviewSummary(userId: string, tmdbId: number, mediaType: MediaType) {
  const [myReview, page, stats] = await Promise.all([
    getMyReview(userId, tmdbId, mediaType),
    getMediaReviewsPage(tmdbId, mediaType, PREVIEW_LIMIT, 0),
    getMediaStats(tmdbId, mediaType),
  ]);

  return {
    my_review: myReview,
    reviews: page.reviews,
    count: page.count,
    stats,
  };
}
