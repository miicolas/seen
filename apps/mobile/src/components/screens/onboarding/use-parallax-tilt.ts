import {
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

// Device-tilt parallax: the background drifts at half the foreground's
// amplitude so the artwork appears behind the content.
export function useParallaxTilt() {
  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: 20 });

  const foregroundStyle = useAnimatedStyle(() => {
    const { pitch, roll } = rotation.sensor.value;
    return {
      transform: [
        { translateX: withSpring(-roll * 10, { damping: 500 }) },
        { translateY: withSpring(-pitch * 10, { damping: 500 }) },
      ],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const { pitch, roll } = rotation.sensor.value;
    return {
      transform: [
        { translateX: withSpring(-roll * 5, { damping: 500 }) },
        { translateY: withSpring(-pitch * 5, { damping: 500 }) },
      ],
    };
  });

  return { foregroundStyle, backgroundStyle };
}
