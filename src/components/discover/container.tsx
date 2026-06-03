import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useDiscoverMovies } from "@/hooks/use-discover-movies";
import type { TmdbMovieSummary } from "@/lib/tmdb";

import { DiscoverSkeleton } from "./discover-skeleton";
import { HeroCard } from "./hero-card";
import { PosterCard } from "./poster-card";
import { RankingCard } from "./ranking-card";
import { Shelf } from "./shelf";

const keyOf = (movie: TmdbMovieSummary, index: number) => `${movie.id}-${index}`;

export const DiscoverContainer = () => {
  const { newReleases, popular, topRated, genres, isLoading, error } =
    useDiscoverMovies();

  if (isLoading) return <DiscoverSkeleton />;

  if (error) {
    return (
      <View style={styles.center}>
        <Text size="sm" weight="medium" align="center">
          {error}
        </Text>
      </View>
    );
  }

  // Slice the popular list so the featured hero and the Popular row don't repeat
  // the same movies. Empty shelves render nothing (see `Shelf`).
  const featured = popular.slice(0, 5);
  const popularRow = popular.slice(5);
  const topTen = topRated.slice(0, 10);

  return (
    <View style={styles.container}>
      <Shelf
        hideHeader
        snap
        data={featured}
        keyExtractor={keyOf}
        visibleCards={1.05}
        renderItem={(movie, _index, cardWidth) => (
          <HeroCard movie={movie} width={cardWidth} />
        )}
      />

      <Shelf
        title="New Releases"
        subtitle="Recently added films"
        data={newReleases}
        keyExtractor={keyOf}
        visibleCards={1.6}
        renderItem={(movie, _index, cardWidth) => (
          <PosterCard movie={movie} width={cardWidth} />
        )}
      />

      <Shelf
        title="Popular"
        eyebrow="Trending"
        data={popularRow}
        keyExtractor={keyOf}
        visibleCards={2.2}
        renderItem={(movie, _index, cardWidth) => (
          <PosterCard movie={movie} width={cardWidth} />
        )}
      />

      <Shelf
        title="Top 10 This Week"
        eyebrow="Chart"
        data={topTen}
        keyExtractor={keyOf}
        visibleCards={2.2}
        renderItem={(movie, index, cardWidth) => (
          <RankingCard movie={movie} rank={index + 1} width={cardWidth} />
        )}
      />

      {genres.map((genre) => (
        <Shelf
          key={genre.id}
          title={genre.name}
          data={genre.movies}
          keyExtractor={keyOf}
          visibleCards={2.2}
          renderItem={(movie, _index, cardWidth) => (
            <PosterCard movie={movie} width={cardWidth} />
          )}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SPACING.LG,
    paddingTop: SPACING.SM,
  },
  center: {
    flex: 1,
    paddingVertical: SPACING.XXL,
    alignItems: "center",
    justifyContent: "center",
  },
});
