import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { RatingBar } from "@/components/ui/rating-bar";
import { StarRating } from "@/components/ui/star-rating";
import { Text } from "@/components/ui/text";
import { BORDER_WIDTH, OPACITY, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import type { MovieReviewStats, Review } from "@/services/reviews";

import { DetailSection } from "../detail-section";
import { ReviewCard } from "./review-card";

const STAR_ROWS = [5, 4, 3, 2, 1] as const;

export function RatingsSection({
  title = "Ratings & Reviews",
  stats,
  histogram,
  accentHex,
  reviews,
  reviewCount = reviews.length,
  onOpenReviews,
}: {
  title?: string;
  stats: MovieReviewStats | null;
  histogram: number[];
  accentHex: string;
  reviews: Review[];
  reviewCount?: number;
  onOpenReviews?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const hasStats = stats && stats.avg_rating != null && stats.rating_count > 0;
  const writtenReviews = reviews.filter(
    (review) => Boolean(review.title?.trim()) || Boolean(review.comment?.trim()),
  );
  const hasReviews = reviews.length > 0;
  const hasWrittenReviews = writtenReviews.length > 0;
  const visibleReviews = hasWrittenReviews ? writtenReviews : reviews.slice(0, 1);
  const totalReviews = Math.max(
    reviewCount,
    reviews.length,
    stats?.review_count ?? 0,
  );
  const shouldShowAllReviews = Boolean(
    onOpenReviews && totalReviews > reviews.length,
  );

  // Collapse the 10 half-star buckets into 5 whole-star rows (index 0 = 1★ … 4 = 5★).
  const { starCounts, maxStar } = useMemo(() => {
    const counts = [1, 2, 3, 4, 5].map(
      (star) => (histogram[star * 2 - 2] ?? 0) + (histogram[star * 2 - 1] ?? 0),
    );
    return { starCounts: counts, maxStar: Math.max(1, ...counts) };
  }, [histogram]);

  if (!hasStats && !hasReviews) return null;

  return (
    <DetailSection title={title}>
      {hasStats ? (
        <View
          style={[
            styles.summaryBlock,
            {
              borderTopColor: theme.backgroundSelected,
              borderBottomColor: theme.backgroundSelected,
            },
          ]}>
          <View style={styles.summaryTop}>
            <View style={styles.scoreBlock}>
              <Text size="2xl" weight="heavy">
                {stats.avg_rating!.toFixed(1)}
              </Text>
              <Text size="xs" weight="semibold" color={theme.textSecondary}>
                {t("mediaDetail.outOfFive")}
              </Text>
              <StarRating value={stats.avg_rating!} size="xs" readOnly />
            </View>

            <View style={styles.summaryCopy}>
              <Text
                size="md"
                weight="bold"
                color={theme.text}
                fillWidth>
                {t("mediaDetail.ratingAndReviewSummary", {
                  ratingCount: stats.rating_count,
                  ratingPlural: stats.rating_count === 1 ? "" : "s",
                  reviewCount: totalReviews,
                  reviewPlural: totalReviews === 1 ? "" : "s",
                })}
              </Text>
            </View>
          </View>

          <View style={styles.bars}>
            {STAR_ROWS.map((star) => {
              const count = starCounts[star - 1];
                  const fraction = count > 0 ? Math.max(count / maxStar, 0.06) : 0;
              return (
                <View key={star} style={styles.barRow}>
                  <View style={styles.barLabel}>
                    <Text size="xs" weight="semibold" color={theme.textSecondary}>
                      {`${star}★`}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <RatingBar
                      fraction={fraction}
                      color={accentHex}
                      trackColor={theme.backgroundElement}
                    />
                  </View>
                  <View style={styles.barCount}>
                    <Text size="xs" weight="regular" color={theme.textSecondary}>
                      {String(count)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {hasReviews ? (
        <View style={styles.reviewsBlock}>
          <View style={styles.reviewsHeader}>
            <Text size="sm" weight="bold" color={theme.textSecondary}>
              {hasWrittenReviews
                ? t("mediaDetail.recentReviews")
                : t("mediaDetail.recentRatings")}
            </Text>
            {shouldShowAllReviews ? (
              <Pressable
                accessibilityRole="button"
                onPress={onOpenReviews}
                style={({ pressed }) => [
                  styles.viewAllButton,
                  {
                    opacity: pressed ? OPACITY.PRESSED : 1,
                  },
                ]}>
                <Text size="xs" weight="bold" color={accentHex}>
                  {t("mediaDetail.viewAllReviews", { count: totalReviews })}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View
            style={[
              styles.reviewList,
              { borderBottomColor: theme.backgroundSelected },
            ]}>
            {visibleReviews.map((item) => (
              <ReviewCard key={item.id} review={item} variant="preview" />
            ))}
          </View>
        </View>
      ) : null}
    </DetailSection>
  );
}

const styles = StyleSheet.create({
  summaryBlock: {
    gap: 20,
    paddingTop: 18,
    paddingBottom: 22,
    borderTopWidth: BORDER_WIDTH.THIN,
    borderBottomWidth: BORDER_WIDTH.THIN,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  scoreBlock: {
    width: 124,
    alignItems: "flex-start",
    gap: 6,
  },
  summaryCopy: {
    flex: 1,
    gap: SPACING.SM,
  },
  bars: {
    gap: 10,
  },
  barRow: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barLabel: {
    width: 34,
    alignItems: "flex-end",
  },
  barTrack: {
    flex: 1,
  },
  barCount: {
    width: 32,
    alignItems: "flex-end",
  },
  reviewsBlock: {
    gap: SPACING.SM,
    paddingTop: SPACING.SM,
  },
  reviewsHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.SM,
  },
  viewAllButton: {
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: SPACING.MD,
  },
  reviewList: {
    borderBottomWidth: BORDER_WIDTH.THIN,
  },
});
