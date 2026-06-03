import { StyleSheet, View } from "react-native";

import {
  DARK_SCRIM,
  LinearGradientImageBlur,
} from "@/components/linear-gradient-image-blur";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { truncate } from "@/lib/format";
import { hapticTap } from "@/lib/haptics";
import { tmdbImageUrl, type TmdbMovieSummary } from "@/lib/tmdb";

interface RankingCardProps {
  movie: TmdbMovieSummary;
  /** 1-based position in the ranking. */
  rank: number;
  /** Card width from the shelf peek math; ranking keeps a tall portrait. */
  width: number;
}

/**
 * Numbered "Top 10" portrait card: a big rank number top-left and the title +
 * rating at the bottom, both white over a dark scrim.
 */
export function RankingCard({ movie, rank, width }: RankingCardProps) {
  const uri = tmdbImageUrl(movie.poster_path ?? movie.backdrop_path, "w500");
  const name = truncate(movie.title ?? movie.original_title ?? "Untitled", 20);
  const rating =
    typeof movie.vote_average === "number" && movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : undefined;

  function handlePress() {
    hapticTap();
    // TODO: navigate to a movie-detail screen once it exists.
  }

  return (
    <Card
      variant="plain"
      onPress={handlePress}
      style={{ width, height: width * 1.4, padding: 0 }}>
      <LinearGradientImageBlur
        imageUrl={uri ? { uri } : undefined}
        showGradient
        showProgressiveBlur
        blurIntensity={20}
        lightGradientColors={DARK_SCRIM}
        darkGradientColors={DARK_SCRIM}
      />
      <ThemedText type="title" style={styles.rank}>
        {String(rank)}
      </ThemedText>
      <View style={styles.info}>
        <Text size="sm" weight="bold" color="#ffffff">
          {name}
        </Text>
        {rating ? (
          <Text size="xs" weight="medium" color="#ffffff">
            {`★ ${rating}`}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  rank: {
    position: "absolute",
    top: SPACING.SM,
    left: SPACING.SM,
    color: "#ffffff",
    fontWeight: "800",
  },
  info: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.SM,
    gap: SPACING.XS,
  },
});
