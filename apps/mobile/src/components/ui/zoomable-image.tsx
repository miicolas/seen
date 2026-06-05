import { Image, type ImageProps } from "expo-image";
import { Dimensions, StyleSheet, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BLURHASH =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

interface ZoomableImageProps {
  uri: string;
  style?: ViewStyle;
  minScale?: number;
  maxScale?: number;
  placeholder?: ImageProps["placeholder"];
}

// Spring configuration for smooth, natural animations like iPhone Photos.
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const TIMING_CONFIG = {
  duration: 300,
};

export function ZoomableImage({
  uri,
  style,
  minScale = 1,
  maxScale = 4,
  placeholder = { blurhash: BLURHASH },
}: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const containerWidth = SCREEN_WIDTH;
  const containerHeight = SCREEN_HEIGHT;

  const clampTranslation = (x: number, y: number, scaleValue: number): { x: number; y: number } => {
    "worklet";

    if (scaleValue <= 1) {
      return { x: 0, y: 0 };
    }

    const scaledWidth = containerWidth * scaleValue;
    const scaledHeight = containerHeight * scaleValue;

    const maxTranslateX = Math.max(0, (scaledWidth - containerWidth) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - containerHeight) / 2);

    const clampedX = Math.min(Math.max(x, -maxTranslateX), maxTranslateX);
    const clampedY = Math.min(Math.max(y, -maxTranslateY), maxTranslateY);

    return { x: clampedX, y: clampedY };
  };

  const reset = () => {
    "worklet";
    scale.value = withSpring(1, SPRING_CONFIG);
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .enableTrackpadTwoFingerGesture(true)
    .maxPointers(2)
    .onStart(() => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        const velocityFactor = 0.2;
        const targetX = translateX.value + e.velocityX * velocityFactor;
        const targetY = translateY.value + e.velocityY * velocityFactor;

        const clamped = clampTranslation(targetX, targetY, scale.value);

        translateX.value = withSpring(clamped.x, SPRING_CONFIG);
        translateY.value = withSpring(clamped.y, SPRING_CONFIG);

        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);

      savedScale.value = scale.value;

      originX.value = e.focalX - containerWidth / 2;
      originY.value = e.focalY - containerHeight / 2;

      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;

      const clampedScale = Math.max(minScale * 0.85, Math.min(newScale, maxScale * 1.1));

      scale.value = clampedScale;

      const scaleDiff = clampedScale - savedScale.value;

      translateX.value = savedTranslateX.value - originX.value * scaleDiff;
      translateY.value = savedTranslateY.value - originY.value * scaleDiff;
    })
    .onEnd(() => {
      if (scale.value < minScale) {
        reset();
      } else if (scale.value > maxScale) {
        const scaleRatio = maxScale / scale.value;

        scale.value = withSpring(maxScale, SPRING_CONFIG);
        translateX.value = withSpring(translateX.value * scaleRatio, SPRING_CONFIG);
        translateY.value = withSpring(translateY.value * scaleRatio, SPRING_CONFIG);

        savedScale.value = maxScale;
      } else {
        const clamped = clampTranslation(translateX.value, translateY.value, scale.value);

        if (
          Math.abs(clamped.x - translateX.value) > 1 ||
          Math.abs(clamped.y - translateY.value) > 1
        ) {
          translateX.value = withSpring(clamped.x, SPRING_CONFIG);
          translateY.value = withSpring(clamped.y, SPRING_CONFIG);
        }

        savedScale.value = scale.value;
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((e) => {
      if (scale.value > 1.1) {
        reset();
      } else {
        const targetScale = Math.min(2.5, maxScale);

        const tapX = e.x - containerWidth / 2;
        const tapY = e.y - containerHeight / 2;

        const targetX = -tapX * (targetScale - 1);
        const targetY = -tapY * (targetScale - 1);

        const clamped = clampTranslation(targetX, targetY, targetScale);

        scale.value = withTiming(targetScale, TIMING_CONFIG);
        translateX.value = withTiming(clamped.x, TIMING_CONFIG);
        translateY.value = withTiming(clamped.y, TIMING_CONFIG);

        savedScale.value = targetScale;
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Race lets a double-tap win cleanly; pinch and pan run together otherwise.
  const pinchPanGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const composed = Gesture.Race(doubleTapGesture, pinchPanGesture);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, style]}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
            placeholder={placeholder}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
