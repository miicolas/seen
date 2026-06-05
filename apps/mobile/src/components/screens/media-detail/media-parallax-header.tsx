import { Image, type ImageLoadEventData } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { PressableScale } from "pressto";
import { type PropsWithChildren, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";
import { imageViewerHref } from "@/lib/navigation";

const BLURHASH =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export function MediaParallaxHeader({
  backdropUri,
  posterUri,
  headerHeight,
  bottomInset,
  adaptToHero = false,
  children,
}: PropsWithChildren<{
  backdropUri?: string | null;
  posterUri?: string | null;
  headerHeight: number;
  bottomInset: number;
  adaptToHero?: boolean;
}>) {
  const theme = useTheme();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Real backdrop renders sharp; when missing, blur the poster so it reads as an
  // ambient background instead of duplicating the poster card below.
  const heroUri = backdropUri ?? posterUri;
  const heroBlur = backdropUri ? 0 : 40;
  // Landscape episode stills (16:9) over-zoom inside the tall default box; when
  // asked to adapt, shrink the header to the hero's natural ratio so it shows
  // uncropped. Never grow past headerHeight (keeps a portrait fallback tall).
  const [heroRatio, setHeroRatio] = useState<number | null>(null);
  const resolvedHeight =
    adaptToHero && heroRatio ? Math.min(headerHeight, Math.round(width / heroRatio)) : headerHeight;
  const onHeroLoad = (event: ImageLoadEventData) => {
    const { width: w, height: h } = event.source;
    if (w > 0 && h > 0) setHeroRatio(w / h);
  };
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY =
      scrollOffset.value <= 0
        ? interpolate(scrollOffset.value, [-resolvedHeight, 0], [-resolvedHeight / 2, 0])
        : 0;
    const scale =
      scrollOffset.value <= 0 ? interpolate(scrollOffset.value, [-resolvedHeight, 0], [2, 1]) : 1;
    return { transform: [{ translateY }, { scale }] };
  });

  return (
    <View style={[styles.viewContainer, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="always"
        contentContainerStyle={{ paddingBottom: bottomInset + SPACING.LG }}>
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: theme.background, height: resolvedHeight },
            headerAnimatedStyle,
          ]}>
          {heroUri ? (
            <PressableScale
              onPress={() => {
                hapticTap();
                router.push(imageViewerHref(heroUri));
              }}
              style={StyleSheet.absoluteFill}>
              <Image
                source={{ uri: heroUri }}
                placeholder={{ blurhash: BLURHASH }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
                blurRadius={heroBlur}
                transition={400}
                onLoad={onHeroLoad}
              />
            </PressableScale>
          ) : null}
          <LinearGradient
            colors={["transparent", "transparent", theme.background]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={[styles.contentChildren, { marginTop: -resolvedHeight }]}>
          <View style={[styles.body, { marginTop: top * 3 }]}>
            <Link.AppleZoomTarget>
              <View style={styles.posterShadow}>
                <Image
                  source={posterUri ? { uri: posterUri } : undefined}
                  style={[styles.posterCard, { backgroundColor: theme.backgroundElement }]}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            </Link.AppleZoomTarget>
            {children}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    position: "relative",
  },
  header: {
    width: "100%",
    overflow: "hidden",
  },
  contentChildren: {
    position: "relative",
    width: "100%",
  },
  body: {
    gap: SPACING.SM,
    paddingHorizontal: SPACING.MD,
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
