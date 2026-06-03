import { Button, Host, HStack, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  font,
  foregroundColor,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradientImageBlur } from "@/components/linear-gradient-image-blur";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { hapticTap } from "@/lib/haptics";
import { useOnboardingStore } from "@/store/use-onboarding-store";

const DARK_GRADIENT = [
  "transparent",
  "#00000040",
  "#000000B0",
  "#000000",
] as const;

export function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const markSeenAction = useOnboardingStore((s) => s.markSeenAction);

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

  function handleStart() {
    hapticTap();
    markSeenAction();
    // Marking onboarding as seen flips the guard in `_layout.tsx`, which reveals
    // the login screen. No imperative navigation needed.
  }

  return (
    <View style={styles.container}>
      {/* Overscanned so the parallax shift never reveals the image edges. */}
      <Animated.View style={[styles.background, backgroundStyle]}>
        <LinearGradientImageBlur
          imageUrl={require("@/assets/images/background/cover-seen.png")}
          showGradient
          showProgressiveBlur
          lightGradientColors={DARK_GRADIENT}
          darkGradientColors={DARK_GRADIENT}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 32) },
          foregroundStyle,
        ]}
      >
        <View style={styles.textWrapper}>
          <ThemedText style={styles.title}>
            Tout ce que tu as vu, au même endroit
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Note, critique et garde une trace de tes films et séries
          </ThemedText>
        </View>

        <Host matchContents style={styles.buttonHost}>
          <Button
            modifiers={[
              controlSize("mini"),
              buttonStyle("glassProminent"),
              tint("#ffffff"),
            ]}
            onPress={handleStart}
          >
            <HStack
              spacing={8}
              modifiers={[frame({ width: width - 80, height: 44 })]}
            >
              <SwiftUIText
                modifiers={[
                  font({ weight: "semibold", size: 16 }),
                  foregroundColor("#000000"),
                ]}
              >
                Commencer
              </SwiftUIText>
            </HStack>
          </Button>
        </Host>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  background: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
  },
  content: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: "center",
    paddingHorizontal: Spacing.three,
  },
  textWrapper: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "400",
    textAlign: "center",
    marginTop: Spacing.two,
    color: "#ffffffB3",
  },
  buttonHost: {
    width: "100%",
    overflow: "visible",
    marginTop: Spacing.four,
  },
});
