import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticSelection } from "@/lib/haptics";
import type { SeedItem } from "@/services/preferences";

import { SwipeActions } from "./swipe-actions";
import { SwipeCard } from "./swipe-card";
import type { SwipeChoice } from "./use-taste-swipe";

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };
const FLY_DURATION = 240;
const SWIPE_VELOCITY = 800;

type Props = {
  card: SeedItem;
  nextCard: SeedItem | null;
  onDecide: (choice: SwipeChoice) => void;
  disabled?: boolean;
};

// Keyed by card id at the parent, so it remounts with fresh shared values for
// each card — no manual reset, no flung-card flash on advance.
export function SwipeDeck({ card, nextCard, onDecide, disabled }: Props) {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  // The card fills whatever vertical space is left between the header and the
  // action row (measured via onLayout), capped by the 2:3 poster ratio.
  const [stackAreaHeight, setStackAreaHeight] = useState(0);
  const maxCardWidth = width - SPACING.MD * 2;
  const cardHeight = Math.min(maxCardWidth * 1.5, stackAreaHeight);
  const cardWidth = cardHeight / 1.5;
  const threshold = width * 0.25;

  const hasFlownOut = useSharedValue(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  function commit(choice: SwipeChoice) {
    hapticSelection();
    onDecide(choice);
  }

  // Assigning `.value` from JS schedules on the UI thread; the timing callback
  // is a worklet that bounces the result back to JS.
  function flyOut(choice: SwipeChoice) {
    if (disabled || hasFlownOut.value) return;
    hasFlownOut.value = true;

    const toX = choice === "like" ? width * 1.5 : choice === "dislike" ? -width * 1.5 : 0;
    const toY = choice === "skip" ? height : 0;
    translateX.value = withTiming(toX, { duration: FLY_DURATION });
    translateY.value = withTiming(toY, { duration: FLY_DURATION }, (finished) => {
      "worklet";
      if (finished) runOnJS(commit)(choice);
    });
  }

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationX > threshold || e.velocityX > SWIPE_VELOCITY) {
        runOnJS(flyOut)("like");
      } else if (e.translationX < -threshold || e.velocityX < -SWIPE_VELOCITY) {
        runOnJS(flyOut)("dislike");
      } else {
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-8, 0, 8],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotate}deg` },
      ],
    };
  });

  const likeBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const dislikeBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.container}>
      <View
        style={styles.stackArea}
        onLayout={(event) => setStackAreaHeight(event.nativeEvent.layout.height)}>
        {stackAreaHeight > 0 ? (
          <View style={[styles.stack, { width: cardWidth, height: cardHeight }]}>
            {nextCard ? (
              <View style={[StyleSheet.absoluteFill, styles.behind]} pointerEvents="none">
                <SwipeCard item={nextCard} width={cardWidth} height={cardHeight} />
              </View>
            ) : null}

            <GestureDetector gesture={pan}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.floating, cardStyle]}>
                <SwipeCard item={card} width={cardWidth} height={cardHeight} />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.badge,
                    styles.likeBadge,
                    { borderColor: accentHex },
                    likeBadgeStyle,
                  ]}>
                  <Text style={[styles.badgeText, { color: accentHex }]}>{"LIKE"}</Text>
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.badge,
                    styles.dislikeBadge,
                    { borderColor: theme.error },
                    dislikeBadgeStyle,
                  ]}>
                  <Text style={[styles.badgeText, { color: theme.error }]}>{"NOPE"}</Text>
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </View>
        ) : null}
      </View>

      <SwipeActions
        disabled={disabled}
        onDislike={() => flyOut("dislike")}
        onSkip={() => flyOut("skip")}
        onLike={() => flyOut("like")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: SPACING.LG,
  },
  stackArea: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  stack: {
    alignItems: "center",
    justifyContent: "center",
  },
  behind: {
    transform: [{ scale: 0.95 }, { translateY: SPACING.SM }],
  },
  // Lifts the sharp poster off the blurred artwork background.
  floating: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  badge: {
    position: "absolute",
    top: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderWidth: 3,
    borderRadius: BORDER_RADIUS.SM,
  },
  likeBadge: {
    left: SPACING.MD,
    transform: [{ rotateZ: "-12deg" }],
  },
  dislikeBadge: {
    right: SPACING.MD,
    transform: [{ rotateZ: "12deg" }],
  },
  badgeText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
