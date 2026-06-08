import { useCallback, type PropsWithChildren } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from "react-native";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LAYOUT, SPACING } from "@/constants/design-tokens";
import { BottomTabInset } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const END_REACHED_THRESHOLD = 400;

type SocialScrollViewProps = PropsWithChildren<
  ScrollViewProps & {
    contentGap?: number;
    contentTopPadding?: number;
    onEndReached?: () => void;
  }
>;

export function SocialScrollView({
  children,
  contentContainerStyle,
  contentGap = SPACING.MD,
  contentTopPadding = SPACING.MD,
  onEndReached,
  onScroll,
  scrollEventThrottle,
  style,
  ...props
}: SocialScrollViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll?.(event);
      if (!onEndReached) return;

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      if (
        contentSize.height - (contentOffset.y + layoutMeasurement.height) <
        END_REACHED_THRESHOLD
      ) {
        onEndReached();
      }
    },
    [onEndReached, onScroll],
  );

  return (
    <ScrollView
      {...props}
      style={[styles.root, { backgroundColor: theme.background }, style]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? (onEndReached ? 16 : undefined)}
      contentContainerStyle={[
        styles.content,
        {
          gap: contentGap,
          paddingTop: contentTopPadding,
          paddingBottom: insets.bottom + BottomTabInset + SPACING.LG,
        },
        contentContainerStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
    alignSelf: "center",
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
  },
});
