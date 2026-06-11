import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { LinearGradientImageBlur } from "@/components/linear-gradient-image-blur";
import { DARK_GRADIENT } from "@/constants/always-dark";
import { tmdbImageUrl } from "@/lib/tmdb";

interface SwipeBackgroundProps {
  posterPath: string | null;
}

// Full-screen blurred artwork behind the swipe deck (Apple Music "Now Playing" style).
// Only the poster image cross-dissolves on card change; the blur, scrim and dim
// layers above it are static, so transitions stay jank-free. Holds on to the last
// poster while the deck is finishing so the background never flashes to black.
export function SwipeBackground({ posterPath }: SwipeBackgroundProps) {
  const [lastPath, setLastPath] = useState(posterPath);
  if (posterPath && posterPath !== lastPath) setLastPath(posterPath);

  const uri = tmdbImageUrl(posterPath ?? lastPath, "w500");

  return (
    <View style={StyleSheet.absoluteFill}>
      {uri ? (
        <LinearGradientImageBlur
          imageUrl={{ uri }}
          imageTransition={{ duration: 350, effect: "cross-dissolve" }}
          imageContentPosition="center"
          showBlur
          blurIntensity={80}
          tintColor="dark"
          showGradient
          lightGradientColors={DARK_GRADIENT}
          darkGradientColors={DARK_GRADIENT}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
