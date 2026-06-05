import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReviewCard } from "@/components/screens/media-detail/ratings-section/review-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { MaxContentWidth } from "@/constants/theme";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import type { ReviewLike } from "@/services/core";

function pluralSuffix(count: number): string {
  return count === 1 ? "" : "s";
}

export interface ReviewsListViewProps {
  title: string;
  reviews: ReviewLike[];
  count: number;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
}

// Shared paginated reviews screen body, fed by either the movie or episode
// pagination hook. The two sheet routes are thin wrappers over this.
export function ReviewsListView({
  title,
  reviews,
  count,
  isLoadingInitial,
  isLoadingMore,
  isRefreshing,
  error,
  refresh,
  loadMore,
}: ReviewsListViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { accentHex } = useAccentColor();

  const renderReview = ({ item }: { item: ReviewLike }) => (
    <ReviewCard review={item} variant="full" />
  );

  const renderEmpty = () => {
    if (isLoadingInitial) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.empty}>
          <Text size="sm" weight="medium" color={theme.textSecondary} align="center">
            {error}
          </Text>
          <Button title={t("mediaDetail.retry")} onPress={refresh} variant="glass" size="sm" />
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <EmptyState
          icon="star.bubble"
          title={t("mediaDetail.noReviewsYet")}
          subtitle={t("mediaDetail.noReviewsHint")}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Title>{t("mediaDetail.allReviews")}</Stack.Title>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text size="xl" weight="heavy" fillWidth numberOfLines={2}>
              {title}
            </Text>
            <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
              {t("mediaDetail.reviewCount", {
                count,
                plural: pluralSuffix(count),
              })}
            </Text>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.LG }]}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={accentHex} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
  },
  header: {
    gap: SPACING.XS,
    paddingBottom: SPACING.MD,
  },
  separator: {
    height: SPACING.SM,
  },
  empty: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.MD,
    paddingHorizontal: SPACING.LG,
  },
  footer: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
