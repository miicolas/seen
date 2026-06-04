import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { LAYOUT } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import {
  hapticDelete,
  hapticError,
  hapticSuccess,
  hapticTap,
} from "@/lib/haptics";
import { starsToRating } from "@/services/core";

import { ReviewForm } from "./review-form";
import type { ReviewController } from "./use-review-controller";

export function ReviewSheetContainer({
  controller,
}: {
  controller: ReviewController;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const buttonWidth = Math.min(
    LAYOUT.CONTENT_MAX_WIDTH,
    Math.max(0, width - LAYOUT.SCREEN_PADDING * 2),
  );

  const [stars, setStars] = useState(controller.initialStars);
  const [reviewTitle, setReviewTitle] = useState(controller.initialTitle);
  const [comment, setComment] = useState(controller.initialComment);

  const [wasLoading, setWasLoading] = useState(controller.isLoading);
  if (wasLoading && !controller.isLoading) {
    setWasLoading(false);
    setStars(controller.initialStars);
    setReviewTitle(controller.initialTitle);
    setComment(controller.initialComment);
  }

  const canSave =
    stars > 0 || reviewTitle.trim().length > 0 || comment.trim().length > 0;
  const { isSaving } = controller;

  const onClose = useCallback(() => {
    hapticTap();
    router.back();
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!canSave || isSaving) return;
    hapticTap();
    const trimmedTitle = reviewTitle.trim();
    const trimmedComment = comment.trim();
    try {
      await controller.save({
        rating: stars > 0 ? starsToRating(stars) : null,
        title: trimmedTitle.length > 0 ? trimmedTitle : null,
        comment: trimmedComment.length > 0 ? trimmedComment : null,
      });
      hapticSuccess();
      router.back();
    } catch {
      hapticError();
    }
  }, [canSave, isSaving, reviewTitle, comment, stars, controller, router]);

  const handleDelete = useCallback(async () => {
    try {
      await controller.remove();
      hapticDelete();
      router.back();
    } catch {
      hapticError();
    }
  }, [controller, router]);

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={onClose}>
          <Stack.Toolbar.Icon sf="xmark" />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          <Stack.Toolbar.Icon sf="arrow.up" />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {controller.isLoading ? (
          <View style={[styles.loading, { backgroundColor: theme.background }]}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <ReviewForm
              mediaTitle={controller.mediaTitle}
              mediaSubtitle={controller.mediaSubtitle}
              posterUri={controller.posterUri}
              stars={stars}
              onStarsChange={setStars}
              reviewTitle={reviewTitle}
              onReviewTitleChange={setReviewTitle}
              comment={comment}
              onCommentChange={setComment}
              nickname={controller.nickname}
              error={controller.error}
            />

            {controller.hasReview ? (
              <View
                style={[
                  styles.footer,
                  {
                    backgroundColor: theme.background,
                    paddingBottom: Math.max(
                      insets.bottom,
                      LAYOUT.SCREEN_PADDING,
                    ),
                  },
                ]}
              >
                <Button
                  title={t("review.deleteReview")}
                  onPress={handleDelete}
                  variant="glass"
                  color="red"
                  size="sm"
                  width={buttonWidth}
                  disabled={isSaving}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: 8,
    alignItems: "center",
  },
});
