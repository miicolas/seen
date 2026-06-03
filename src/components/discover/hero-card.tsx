import { StyleSheet, View } from "react-native";

import {
  DARK_SCRIM,
  LinearGradientImageBlur,
} from "@/components/linear-gradient-image-blur";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { truncate } from "@/lib/format";
import { hapticTap } from "@/lib/haptics";
import { tmdbImageUrl, type TmdbMovieSummary } from "@/lib/tmdb";

interface HeroCardProps {
  movie: TmdbMovieSummary;
  /** Card width from the shelf peek math; hero keeps a 16:9 backdrop. */
  width: number;
  eyebrow?: string;
}

/**
 * Large landscape "Featured" card: a wide backdrop with an eyebrow + title
 * overlaid at the bottom over a dark scrim.
 */
export function HeroCard({ movie, width, eyebrow = "Featured" }: HeroCardProps) {
  const uri = tmdbImageUrl(movie.backdrop_path ?? movie.poster_path, "w1280");
  const title = truncate(movie.title ?? movie.original_title ?? "Untitled", 32);

  function handlePress() {
    hapticTap();
    // TODO: navigate to a movie-detail screen once it exists.
  }

  return (
    <Card
      variant="plain"
      onPress={handlePress}
      style={{ width, height: width * (9 / 16), padding: 0 }}>
      <LinearGradientImageBlur
        imageUrl={uri ? { uri } : undefined}
        showGradient
        showProgressiveBlur
        blurIntensity={20}
        lightGradientColors={DARK_SCRIM}
        darkGradientColors={DARK_SCRIM}
      />
      <View style={styles.overlay}>
        <Text size="xs" weight="bold" color="#ffffff">
          {eyebrow.toUpperCase()}
        </Text>
        <Text size="xl" weight="bold" color="#ffffff">
          {title}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.MD,
    gap: SPACING.XS,
  },
});
