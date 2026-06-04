import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { StarRating } from "@/components/ui/star-rating";
import { Text } from "@/components/ui/text";
import { BORDER_WIDTH, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { formatDate } from "@/lib/format";
import { ratingToStars, type ReviewLike } from "@/services/core";

type ReviewCardVariant = "preview" | "full";

export function ReviewCard({
  review,
  variant = "preview",
}: {
  review: ReviewLike;
  variant?: ReviewCardVariant;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isPreview = variant === "preview";
  const hasWrittenReview =
    Boolean(review.title?.trim()) || Boolean(review.comment?.trim());
  const date = formatDate(review.created_at);

  return (
    <View
      style={[
        styles.row,
        !hasWrittenReview ? styles.ratingOnlyRow : null,
        { borderTopColor: theme.backgroundSelected },
      ]}>
      <View style={styles.header}>
        <View style={styles.ratingLine}>
          {review.rating != null ? (
            <StarRating
              value={ratingToStars(review.rating)}
              size="xs"
              emptyColor={theme.backgroundSelected}
              readOnly
            />
          ) : (
            <Text size="xs" weight="semibold" color={theme.textSecondary}>
              {t("mediaDetail.noRating")}
            </Text>
          )}
        </View>
        {date ? (
          <Text size="xs" weight="regular" color={theme.textSecondary}>
            {date}
          </Text>
        ) : null}
      </View>

      {review.title?.trim() ? (
        <Text
          size="md"
          weight="bold"
          fillWidth
          numberOfLines={isPreview ? 2 : undefined}>
          {review.title.trim()}
        </Text>
      ) : null}

      {review.comment?.trim() ? (
        <Text
          size="sm"
          weight="regular"
          fillWidth
          numberOfLines={isPreview ? 4 : undefined}>
          {review.comment.trim()}
        </Text>
      ) : hasWrittenReview ? null : (
        <Text size="xs" weight="medium" color={theme.textSecondary} fillWidth>
          {t("mediaDetail.ratingOnlyReview")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    gap: SPACING.SM,
    paddingVertical: SPACING.MD,
    borderTopWidth: BORDER_WIDTH.THIN,
  },
  ratingOnlyRow: {
    gap: SPACING.XS,
    paddingVertical: SPACING.SM,
  },
  header: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.SM,
  },
  ratingLine: {
    minWidth: 112,
  },
});
