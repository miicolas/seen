import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useDiscoverMedia } from "@/hooks/use-discover-media";
import type { TmdbMovieSummary } from "@/lib/tmdb";

import { DiscoverSkeleton } from "./discover-skeleton";
import { HeroCard } from "./hero-card";
import { PosterCard } from "./poster-card";
import { RankingCard } from "./ranking-card";
import { Shelf } from "./shelf";

// Movies and series share the same numeric id space, so key on media_type too.
const keyOf = (media: TmdbMovieSummary, index: number) =>
  `${media.media_type}-${media.id}-${index}`;

export const DiscoverContainer = () => {
  const { trending, topToday, newReleases, genres, isLoading, error } =
    useDiscoverMedia();

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

  // Slice the trending list so the featured hero and the Trending row don't
  // repeat the same titles. Empty shelves render nothing (see `Shelf`).
  const featured = trending.slice(0, 5);
  const trendingRow = trending.slice(5);
  const topTen = topToday.slice(0, 10);

  return (
    <View style={styles.container}>
      <Shelf
        hideHeader
        snap
        data={featured}
        keyExtractor={keyOf}
        visibleCards={1.05}
        renderItem={(media, _index, cardWidth) => (
          <HeroCard movie={media} width={cardWidth} />
        )}
      />

      <Shelf
        title="Trending Now"
        eyebrow="Movies & Series"
        data={trendingRow}
        keyExtractor={keyOf}
        visibleCards={2.2}
        renderItem={(media, _index, cardWidth) => (
          <PosterCard movie={media} width={cardWidth} />
        )}
      />

      <Shelf
        title="Top 10 Today"
        eyebrow="Chart"
        data={topTen}
        keyExtractor={keyOf}
        visibleCards={2.2}
        renderItem={(media, index, cardWidth) => (
          <RankingCard movie={media} rank={index + 1} width={cardWidth} />
        )}
      />

      <Shelf
        title="New Releases"
        subtitle="Fresh films and shows"
        data={newReleases}
        keyExtractor={keyOf}
        visibleCards={1.6}
        renderItem={(media, _index, cardWidth) => (
          <PosterCard movie={media} width={cardWidth} />
        )}
      />

      {genres.map((genre) => (
        <Shelf
          key={genre.name}
          title={genre.name}
          data={genre.media}
          keyExtractor={keyOf}
          visibleCards={2.2}
          renderItem={(media, _index, cardWidth) => (
            <PosterCard movie={media} width={cardWidth} />
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
