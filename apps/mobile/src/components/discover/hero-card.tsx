import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { truncate } from "@/lib/format";
import { mediaDetailHref, type MediaRouteBase } from "@/lib/navigation";
import { tmdbImageUrl, type TmdbMovieSummary } from "@/lib/tmdb";

import { ScrimArtworkCard } from "./scrim-artwork-card";

interface HeroCardProps {
  movie: TmdbMovieSummary;
  width: number;
  eyebrow?: string;
  base?: MediaRouteBase;
}

export function HeroCard({ movie, width, eyebrow = "Featured", base = "discover" }: HeroCardProps) {
  const uri = tmdbImageUrl(movie.backdrop_path ?? movie.poster_path, "w1280");
  const title = truncate(movie.title ?? movie.original_title ?? "Untitled", 32);

  return (
    <ScrimArtworkCard
      imageUrl={uri}
      width={width}
      aspectRatio={9 / 16}
      href={mediaDetailHref(movie, base)}>
      <View style={styles.overlay}>
        <Text size="xs" weight="bold" color="#ffffff">
          {eyebrow.toUpperCase()}
        </Text>
        <Text size="xl" weight="bold" color="#ffffff">
          {title}
        </Text>
      </View>
    </ScrimArtworkCard>
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
