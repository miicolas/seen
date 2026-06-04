import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ScreenToolbar } from "@/components/navigation";
import { LAYOUT } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

import { ReviewFormBody } from "./review-form-body";
import type { ReviewController } from "./use-review-controller";

export function ReviewComposeContainer({
  controller,
}: {
  controller: ReviewController;
}) {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const buttonWidth = Math.min(
    LAYOUT.CONTENT_MAX_WIDTH,
    Math.max(0, width - LAYOUT.SCREEN_PADDING * 2),
  );

  const onClose = useCallback(() => {
    hapticTap();
    router.back();
  }, [router]);

  return (
    <>
      <ScreenToolbar
        placement="left"
        actions={[{ key: "close", icon: "xmark", onPress: onClose }]}
      />

      <KeyboardAwareScrollView
        bottomOffset={LAYOUT.SCREEN_PADDING}
        contentInsetAdjustmentBehavior="automatic"
      >
        {controller.isLoading ? (
          <View style={[styles.loading, { backgroundColor: theme.background }]}>
            <ActivityIndicator />
          </View>
        ) : (
          // Remount once loaded so the body's native text observables seed with
          // the resolved review values.
          <ReviewFormBody
            key={controller.hasReview ? "edit" : "new"}
            controller={controller}
            buttonWidth={buttonWidth}
          />
        )}
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
});
