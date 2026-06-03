import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

const BLURHASH =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

const POSTER_OVERLAP = 56;

export function MediaParallaxHeader({
  backdropUri,
  posterUri,
  headerHeight,
  bottomInset,
  children,
}: PropsWithChildren<{
  backdropUri?: string | null;
  posterUri?: string | null;
  headerHeight: number;
  bottomInset: number;
}>) {
  const theme = useTheme();
  // Real backdrop renders sharp; when missing, blur the poster so it reads as an
  // ambient background instead of duplicating the poster card below.
  const heroUri = backdropUri ?? posterUri;
  const heroBlur = backdropUri ? 0 : 40;
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY =
      scrollOffset.value <= 0
        ? interpolate(
            scrollOffset.value,
            [-headerHeight, 0],
            [-headerHeight / 2, 0],
          )
        : 0;
    const scale =
      scrollOffset.value <= 0
        ? interpolate(scrollOffset.value, [-headerHeight, 0], [2, 1])
        : 1;
    return { transform: [{ translateY }, { scale }] };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingBottom: bottomInset + SPACING.LG }}
    >
      <Animated.View
        style={[styles.header, { height: headerHeight }, headerAnimatedStyle]}
      >
        {heroUri ? (
          <Image
            source={{ uri: heroUri }}
            placeholder={{ blurhash: BLURHASH }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="center"
            blurRadius={heroBlur}
            transition={400}
          />
        ) : null}
        <LinearGradient
          colors={["transparent", "transparent", theme.background]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.body}>
        <Link.AppleZoomTarget>
          <View style={styles.posterShadow}>
            <Image
              source={posterUri ? { uri: posterUri } : undefined}
              style={[
                styles.posterCard,
                { backgroundColor: theme.backgroundElement },
              ]}
              contentFit="cover"
              transition={200}
            />
          </View>
        </Link.AppleZoomTarget>
        {children}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    overflow: "hidden",
  },
  body: {
    marginTop: -POSTER_OVERLAP,
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  posterShadow: {
    alignSelf: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  posterCard: {
    width: 150,
    height: 225,
    borderRadius: 14,
    borderCurve: "continuous",
  },
});
