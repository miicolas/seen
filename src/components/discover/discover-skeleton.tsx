import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { BORDER_RADIUS, OPACITY, SPACING } from "@/constants/design-tokens";
import { MaxContentWidth } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** A looping opacity pulse for skeleton placeholders. */
function usePulse() {
  const opacity = useSharedValue<number>(OPACITY.MUTED);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function SkeletonShelf({
  heightRatio,
  visibleCards,
  count,
}: {
  /** Card height as a multiple of its width. */
  heightRatio: number;
  visibleCards: number;
  count: number;
}) {
  const theme = useTheme();
  const pulse = usePulse();
  const { width } = useWindowDimensions();
  const usable = Math.min(width, MaxContentWidth) - SPACING.MD * 2 - SPACING.MD;
  const cardWidth = usable / (visibleCards + 0.16);

  return (
    <View style={styles.shelf}>
      <Animated.View
        style={[styles.headerBar, pulse, { backgroundColor: theme.backgroundElement }]}
      />
      <View style={styles.row}>
        {Array.from({ length: count }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              pulse,
              {
                width: cardWidth,
                height: cardWidth * heightRatio,
                borderRadius: BORDER_RADIUS.MD,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/** Loading placeholder that mirrors the Discover layout (hero + poster rows). */
export function DiscoverSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonShelf heightRatio={9 / 16} visibleCards={1.05} count={3} />
      <SkeletonShelf heightRatio={1.5} visibleCards={1.6} count={4} />
      <SkeletonShelf heightRatio={1.5} visibleCards={2.2} count={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.LG,
  },
  shelf: {
    gap: SPACING.SM,
  },
  headerBar: {
    marginHorizontal: SPACING.MD,
    width: 160,
    height: 22,
    borderRadius: BORDER_RADIUS.SM,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
});
