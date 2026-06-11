import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { formatPlayerTime } from "@/lib/watch-session-position";

const TIME_TINT = "rgba(255,255,255,0.65)";

export function Scrubber({
  position,
  duration,
  tint,
  onSeek,
}: {
  position: number;
  duration: number;
  tint: string;
  onSeek: (seconds: number) => void;
}) {
  const trackWidth = useSharedValue(1);
  const isScrubbing = useSharedValue(false);
  const scrubFraction = useSharedValue(0);
  const progressFraction = useSharedValue(duration > 0 ? position / duration : 0);
  const [previewSeconds, setPreviewSeconds] = useState<number | null>(null);

  useEffect(() => {
    progressFraction.value = duration > 0 ? position / duration : 0;
  }, [position, duration, progressFraction]);

  function preview(fraction: number) {
    setPreviewSeconds(Math.round(fraction * duration));
  }

  function commit(fraction: number) {
    setPreviewSeconds(null);
    onSeek(Math.round(fraction * duration));
  }

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      isScrubbing.value = true;
      scrubFraction.value = Math.min(Math.max(event.x / trackWidth.value, 0), 1);
      runOnJS(preview)(scrubFraction.value);
    })
    .onUpdate((event) => {
      scrubFraction.value = Math.min(Math.max(event.x / trackWidth.value, 0), 1);
      runOnJS(preview)(scrubFraction.value);
    })
    .onFinalize(() => {
      if (!isScrubbing.value) return;
      isScrubbing.value = false;
      runOnJS(commit)(scrubFraction.value);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${(isScrubbing.value ? scrubFraction.value : progressFraction.value) * 100}%`,
  }));

  const shownPosition = previewSeconds ?? position;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <View
          style={styles.hitArea}
          onLayout={(event) => {
            trackWidth.value = Math.max(event.nativeEvent.layout.width, 1);
          }}>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { backgroundColor: tint }, fillStyle]} />
          </View>
        </View>
      </GestureDetector>
      <View style={styles.times}>
        <Text size="xs" weight="medium" color={TIME_TINT} inline>
          {formatPlayerTime(shownPosition)}
        </Text>
        <Text size="xs" weight="medium" color={TIME_TINT} inline>
          {`-${formatPlayerTime(Math.max(duration - shownPosition, 0))}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: SPACING.XS,
  },
  hitArea: {
    paddingVertical: SPACING.SM,
    justifyContent: "center",
  },
  track: {
    height: 7,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.FULL,
  },
  times: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
