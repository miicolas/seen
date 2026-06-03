import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { truncate } from "@/lib/format";
import { mediaDetailHref } from "@/lib/navigation";
import { tmdbImageUrl, type TmdbMovieSummary } from "@/lib/tmdb";

import { ScrimArtworkCard } from "./scrim-artwork-card";

interface RankingCardProps {
  movie: TmdbMovieSummary;
  rank: number;
  width: number;
}

export function RankingCard({ movie, rank, width }: RankingCardProps) {
  const uri = tmdbImageUrl(movie.poster_path ?? movie.backdrop_path, "w500");
  const name = truncate(movie.title ?? movie.original_title ?? "Untitled", 20);
  const rating =
    typeof movie.vote_average === "number" && movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : undefined;

  return (
    <ScrimArtworkCard
      imageUrl={uri}
      width={width}
      aspectRatio={1.4}
      href={mediaDetailHref(movie)}>
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
    </ScrimArtworkCard>
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
