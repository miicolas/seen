import { StyleSheet, View } from "react-native";

import { Button, IconButton } from "@/components/ui/button";
import { SPACING } from "@/constants/design-tokens";

export function MediaActions({
  hasRating,
  accentHex,
  onRate,
  showReviewAction = true,
  showWatchlistAction = false,
  isInWatchlist = false,
  isWatchlistSaving = false,
  onToggleWatchlist,
  watchlistLabel,
  reviewedLabel = "Rated",
  unreviewedLabel = "Mark as seen",
}: {
  hasRating: boolean;
  accentHex: string;
  onRate: () => void;
  showReviewAction?: boolean;
  showWatchlistAction?: boolean;
  isInWatchlist?: boolean;
  isWatchlistSaving?: boolean;
  onToggleWatchlist?: () => void;
  watchlistLabel?: string;
  reviewedLabel?: string;
  unreviewedLabel?: string;
}) {
  const canShowWatchlist = showWatchlistAction && onToggleWatchlist && watchlistLabel && !hasRating;

  return (
    <View style={styles.actionContainer}>
      {showReviewAction ? (
        <Button
          icon={hasRating ? "checkmark" : "star.fill"}
          title={hasRating ? reviewedLabel : unreviewedLabel}
          tintColor={accentHex}
          onPress={onRate}
          width="fill"
          haptic
        />
      ) : null}
      {canShowWatchlist ? (
        <IconButton
          icon={isInWatchlist ? "bookmark.slash.fill" : "bookmark"}
          accessibilityLabel={watchlistLabel}
          onPress={onToggleWatchlist}
          tintColor="#FFFFFF"
          iconColor={accentHex}
          disabled={isWatchlistSaving}
          haptic
          role={isInWatchlist ? "cancel" : "default"}
          symbolTransitionValue={isInWatchlist}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    height: 56,
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: SPACING.MD,
    marginTop: SPACING.SM,
  },
});
