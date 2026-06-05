import { useNativeState } from "@expo/ui/swift-ui";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenToolbar } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { LAYOUT } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticDelete, hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { runReviewStatusActivity } from "@/lib/review-status-activity";
import { starsToRating } from "@/services/core";

import { ReviewForm } from "./review-form";
import type { ReviewController } from "./use-review-controller";

// Owns the form's interactive state. Mounted only once the controller has loaded
// (keyed by the container), so the native text observables seed synchronously
// with the resolved review values — no `.value` writes, no empty-then-fill flash.
export function ReviewFormBody({ controller }: { controller: ReviewController }) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const reviewTitleState = useNativeState(controller.initialTitle);
  const commentState = useNativeState(controller.initialComment);

  const [stars, setStars] = useState(controller.initialStars);
  // Cheap emptiness signals so `canSave` stays reactive without mirroring the
  // full text into React: they only flip at the empty↔non-empty boundary.
  const [titleHasText, setTitleHasText] = useState(controller.initialTitle.trim().length > 0);
  const [commentHasText, setCommentHasText] = useState(controller.initialComment.trim().length > 0);

  const onTitleChange = useCallback((text: string) => {
    setTitleHasText((prev) => {
      const next = text.trim().length > 0;
      return next === prev ? prev : next;
    });
  }, []);

  const onCommentChange = useCallback((text: string) => {
    setCommentHasText((prev) => {
      const next = text.trim().length > 0;
      return next === prev ? prev : next;
    });
  }, []);

  const canSave = stars > 0 || titleHasText || commentHasText;
  const { isSaving } = controller;

  const handleSave = useCallback(async () => {
    if (!canSave || isSaving) return;
    hapticTap();
    const trimmedTitle = reviewTitleState.value.trim();
    const trimmedComment = commentState.value.trim();
    try {
      await runReviewStatusActivity("save", () =>
        controller.save({
          rating: stars > 0 ? starsToRating(stars) : null,
          title: trimmedTitle.length > 0 ? trimmedTitle : null,
          comment: trimmedComment.length > 0 ? trimmedComment : null,
        }),
      );
      hapticSuccess();
      router.back();
    } catch {
      hapticError();
    }
  }, [canSave, isSaving, reviewTitleState, commentState, stars, controller, router]);

  const handleDelete = useCallback(async () => {
    try {
      await runReviewStatusActivity("delete", () => controller.remove());
      hapticDelete();
      router.back();
    } catch {
      hapticError();
    }
  }, [controller, router]);

  return (
    <>
      <ScreenToolbar
        placement="right"
        actions={[
          {
            key: "save",
            icon: "arrow.up",
            onPress: handleSave,
            disabled: !canSave || isSaving,
          },
        ]}
      />

      <ReviewForm
        mediaTitle={controller.mediaTitle}
        mediaSubtitle={controller.mediaSubtitle}
        posterUri={controller.posterUri}
        stars={stars}
        onStarsChange={setStars}
        reviewTitleState={reviewTitleState}
        onTitleChange={onTitleChange}
        commentState={commentState}
        onCommentChange={onCommentChange}
        nickname={controller.nickname}
        error={controller.error}
      />

      {controller.hasReview ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom, LAYOUT.SCREEN_PADDING),
            },
          ]}>
          <Button
            title={t("review.deleteReview")}
            onPress={handleDelete}
            variant="glass"
            color="red"
            size="sm"
            width="fill"
            disabled={isSaving}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: 8,
    alignItems: "center",
  },
});
