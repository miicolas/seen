// Minimal review shape shared by movie reviews (Review) and episode reviews
// (EpisodeReview) so one review card / list can render either.
export interface ReviewLike {
  id: string;
  rating: number | null;
  title: string | null;
  comment: string | null;
  created_at: string;
}
