import { MetricPill } from "@/components/ui/metric-pill";
import { useAccentColor } from "@/hooks/use-accent-color";
import { ratingToStars } from "@/services/core/rating";

// Star-rating pill shared by the activity surfaces (profile activity row,
// friends-rated shelf). Renders the rating as a star count tinted with the
// user's accent color.
export function RatingPill({ rating }: { rating: number }) {
  const { accentHex, getBackgroundColor } = useAccentColor();

  return (
    <MetricPill
      icon="star.fill"
      iconSize={10}
      label={String(ratingToStars(rating))}
      tint={accentHex}
      background={getBackgroundColor()}
    />
  );
}
