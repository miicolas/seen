import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type DimensionValue,
} from "react-native";

import { StarRating } from "@/components/ui/star-rating";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { truncate } from "@/lib/format";
import { ratingToStars, type MovieReviewStats, type Review } from "@/services/reviews";

import { DetailSection } from "./detail-section";
import { formatDate } from "./utils";

const STAR_ROWS = [5, 4, 3, 2, 1] as const;

export function RatingsSection({
  stats,
  histogram,
  accentHex,
  reviews,
}: {
  stats: MovieReviewStats | null;
  histogram: number[];
  accentHex: string;
  reviews: Review[];
}) {
  const theme = useTheme();
  const hasStats = stats && stats.avg_rating != null && stats.rating_count > 0;

  // Collapse the 10 half-star buckets into 5 whole-star rows (index 0 = 1★ … 4 = 5★).
  const { starCounts, maxStar } = useMemo(() => {
    const counts = [1, 2, 3, 4, 5].map(
      (star) => (histogram[star * 2 - 2] ?? 0) + (histogram[star * 2 - 1] ?? 0),
    );
    return { starCounts: counts, maxStar: Math.max(1, ...counts) };
  }, [histogram]);

  return (
    <DetailSection title="Ratings & Reviews">
      {hasStats ? (
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.backgroundElement },
          ]}>
          <View style={styles.summaryLeft}>
            <Text size="2xl" weight="heavy">
              {stats.avg_rating!.toFixed(1)}
            </Text>
            <Text size="xs" weight="semibold" color={theme.textSecondary}>
              out of 5
            </Text>
            <View style={styles.summaryStars}>
              <StarRating value={stats.avg_rating!} size="xs" readOnly />
            </View>
            <Text size="xs" weight="regular" color={theme.textSecondary}>
              {`${stats.rating_count} Rating${
                stats.rating_count === 1 ? "" : "s"
              }`}
            </Text>
          </View>

          <View style={styles.bars}>
            {STAR_ROWS.map((star) => {
              const count = starCounts[star - 1];
              const width: DimensionValue = `${
                count > 0 ? Math.max((count / maxStar) * 100, 6) : 0
              }%`;
              return (
                <View
                  key={star}
                  style={[
                    styles.barTrack,
                    { backgroundColor: theme.background },
                  ]}>
                  <View
                    style={[
                      styles.barFill,
                      { width, backgroundColor: accentHex },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {reviews.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reviewRow}>
          {reviews.slice(0, 10).map((item) => (
            <ReviewCard key={item.id} review={item} accentHex={accentHex} />
          ))}
        </ScrollView>
      ) : null}
    </DetailSection>
  );
}

function ReviewCard({
  review,
  accentHex,
}: {
  review: Review;
  accentHex: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[styles.reviewCard, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.reviewHeader}>
        {review.rating != null ? (
          <StarRating
            value={ratingToStars(review.rating)}
            size="xs"
            emptyColor={theme.backgroundSelected}
            readOnly
          />
        ) : (
          <View />
        )}
        <Text size="xs" weight="regular" color={theme.textSecondary}>
          {formatDate(review.created_at) ?? ""}
        </Text>
      </View>
      {review.comment ? (
        <Text size="sm" weight="regular" fillWidth>
          {truncate(review.comment, 180)}
        </Text>
      ) : (
        <Text size="sm" weight="regular" color={theme.textSecondary}>
          No written review
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.LG,
    padding: SPACING.MD,
    borderRadius: 20,
    borderCurve: "continuous",
  },
  summaryLeft: {
    alignItems: "center",
    gap: SPACING.XXS,
    minWidth: 72,
  },
  summaryStars: {
    paddingVertical: SPACING.XXS,
  },
  bars: {
    flex: 1,
    justifyContent: "center",
    gap: SPACING.XS,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    borderCurve: "continuous",
  },
  reviewRow: {
    gap: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  reviewCard: {
    width: 260,
    gap: SPACING.SM,
    padding: SPACING.MD,
    borderRadius: 18,
    borderCurve: "continuous",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
