import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useDiscoverMedia } from "@/hooks/tmdb/use-discover-media";
import type { MediaFilter, TmdbMovieSummary } from "@/lib/tmdb";

import { DiscoverSkeleton } from "./discover-skeleton";
import { HeroCard } from "./hero-card";
import { PosterCard } from "./poster-card";
import { RankingCard } from "./ranking-card";
import { Shelf } from "./shelf";

const keyOf = (media: TmdbMovieSummary, index: number) =>
  `${media.media_type}-${media.id}-${index}`;

export const DiscoverContainer = ({ filter }: { filter: MediaFilter }) => {
  const { t } = useTranslation();
  const { trending, topToday, newReleases, genres, isLoading, error, isOffline } =
    useDiscoverMedia(filter);

  if (isOffline) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="wifi.slash"
          title={t("discover.offlineTitle")}
          subtitle={t("discover.offlineSubtitle")}
        />
      </View>
    );
  }

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

  const featured = trending.slice(0, 5);
  const trendingRow = trending.slice(5);
  const topTen = topToday.slice(0, 10);

  const trendingEyebrow =
    filter === "all"
      ? t("discover.eyebrowAll")
      : filter === "movie"
        ? t("discover.eyebrowMovies")
        : t("discover.eyebrowSeries");
  const newReleasesSubtitle =
    filter === "all"
      ? t("discover.freshAll")
      : filter === "movie"
        ? t("discover.freshMovies")
        : t("discover.freshSeries");

  return (
    <View style={styles.container}>
      <Shelf
        hideHeader
        snap
        data={featured}
        keyExtractor={keyOf}
        visibleCards={1.05}
        renderItem={(media, _index, cardWidth) => <HeroCard movie={media} width={cardWidth} />}
      />

      <Shelf
        title={t("discover.trendingTitle")}
        eyebrow={trendingEyebrow}
        data={trendingRow}
        keyExtractor={keyOf}
        visibleCards={2.2}
        renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
      />

      <Shelf
        title={t("discover.topTodayTitle")}
        eyebrow={t("discover.topTodayEyebrow")}
        data={topTen}
        keyExtractor={keyOf}
        visibleCards={2.2}
        renderItem={(media, index, cardWidth) => (
          <RankingCard movie={media} rank={index + 1} width={cardWidth} />
        )}
      />

      <Shelf
        title={t("discover.newReleasesTitle")}
        subtitle={newReleasesSubtitle}
        data={newReleases}
        keyExtractor={keyOf}
        visibleCards={1.6}
        renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
      />

      {genres.map((genre) => (
        <Shelf
          key={genre.key}
          title={t(`discover.genre${genre.key}` as const, genre.name)}
          data={genre.media}
          keyExtractor={keyOf}
          visibleCards={2.2}
          renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
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
