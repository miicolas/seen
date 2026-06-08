import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useMyPlatforms } from "@/hooks/platforms/use-my-platforms";
import { useNotInterestedList } from "@/hooks/not-interested/use-not-interested-list";
import { useAvailableFeed } from "@/hooks/recommendations/use-available-feed";
import { useDiscoverMedia } from "@/hooks/tmdb/use-discover-media";
import type { MediaFilter, TmdbMovieSummary } from "@/lib/tmdb";

import { DiscoverSkeleton } from "./discover-skeleton";
import { HeroCard } from "./hero-card";
import { PlatformsPrompt } from "./platforms-prompt";
import { PosterCard } from "./poster-card";
import { RankingCard } from "./ranking-card";
import { Shelf } from "./shelf";

const keyOf = (media: TmdbMovieSummary, index: number) =>
  `${media.media_type}-${media.id}-${index}`;

const impressionRef = (media: TmdbMovieSummary) => ({
  tmdbId: media.id,
  mediaType: media.media_type,
});

export const DiscoverContainer = ({ filter }: { filter: MediaFilter }) => {
  const { t } = useTranslation();
  const { trending, topToday, newReleases, genres, isLoading, error, isOffline } =
    useDiscoverMedia(filter);
  const myPlatforms = useMyPlatforms();
  const hasPlatforms = (myPlatforms.data?.providers.length ?? 0) > 0;
  const available = useAvailableFeed({ filter, enabled: hasPlatforms });
  const { isDismissed } = useNotInterestedList();
  const filterDismissed = (media: TmdbMovieSummary) => !isDismissed(media.id, media.media_type);
  const availableMedia = available.data.filter(filterDismissed);
  const availableShort = availableMedia.filter((entry) => entry.isShort);

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

  const visibleTrending = trending.filter(filterDismissed);
  const featured = visibleTrending.slice(0, 5);
  const trendingRow = visibleTrending.slice(5);
  const topTen = topToday.filter(filterDismissed).slice(0, 10);

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
        impressionSource="content"
        impressionItem={impressionRef}
        renderItem={(media, _index, cardWidth) => <HeroCard movie={media} width={cardWidth} />}
      />

      <Shelf
        title={t("discover.trendingTitle")}
        eyebrow={trendingEyebrow}
        data={trendingRow}
        keyExtractor={keyOf}
        visibleCards={2.2}
        impressionSource="trending"
        impressionItem={impressionRef}
        renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
      />

      {hasPlatforms ? (
        <>
          <Shelf
            title={t("discover.availableOnYourServices")}
            eyebrow={t("discover.availableEyebrow")}
            data={availableMedia}
            keyExtractor={keyOf}
            visibleCards={2.2}
            impressionSource="availability"
            impressionItem={impressionRef}
            renderItem={(media, _index, cardWidth) => (
              <PosterCard movie={media} width={cardWidth} />
            )}
          />
          <Shelf
            title={t("discover.shortAndAvailable")}
            eyebrow={t("discover.shortAndAvailableEyebrow")}
            data={availableShort}
            keyExtractor={keyOf}
            visibleCards={2.2}
            impressionSource="availability"
            impressionItem={impressionRef}
            renderItem={(media, _index, cardWidth) => (
              <PosterCard movie={media} width={cardWidth} />
            )}
          />
        </>
      ) : !myPlatforms.isLoading ? (
        <PlatformsPrompt />
      ) : null}

      <Shelf
        title={t("discover.topTodayTitle")}
        eyebrow={t("discover.topTodayEyebrow")}
        data={topTen}
        keyExtractor={keyOf}
        visibleCards={2.2}
        impressionSource="trending"
        impressionItem={impressionRef}
        renderItem={(media, index, cardWidth) => (
          <RankingCard movie={media} rank={index + 1} width={cardWidth} />
        )}
      />

      <Shelf
        title={t("discover.newReleasesTitle")}
        subtitle={newReleasesSubtitle}
        data={newReleases.filter(filterDismissed)}
        keyExtractor={keyOf}
        visibleCards={1.6}
        impressionSource="content"
        impressionItem={impressionRef}
        renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
      />

      {genres.map((genre) => (
        <Shelf
          key={genre.key}
          title={t(`discover.genre${genre.key}` as const, genre.name)}
          data={genre.media.filter(filterDismissed)}
          keyExtractor={keyOf}
          visibleCards={2.2}
          impressionSource="content"
          impressionItem={impressionRef}
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
