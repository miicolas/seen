import { useTranslation } from "react-i18next";

import { HeroCard } from "@/components/discover/hero-card";
import { PlatformsPrompt } from "@/components/discover/platforms-prompt";
import { PosterCard } from "@/components/discover/poster-card";
import { RankingCard } from "@/components/discover/ranking-card";
import { Shelf } from "@/components/discover/shelf";
import type { MediaFilter, TmdbMovieSummary } from "@/lib/tmdb";
import type { AvailableEntry } from "@/services/recommendations";

type GenreShelf = {
  key: string;
  name: string;
  media: TmdbMovieSummary[];
};

const keyOf = (media: TmdbMovieSummary, index: number) =>
  `${media.media_type}-${media.id}-${index}`;

const impressionRef = (media: TmdbMovieSummary) => ({
  tmdbId: media.id,
  mediaType: media.media_type,
});

function filterEyebrow(filter: MediaFilter, all: string, movie: string, tv: string) {
  if (filter === "all") return all;
  if (filter === "movie") return movie;
  return tv;
}

export function SearchDiscoverLeadShelves({
  featured,
  trendingRow,
  filter,
}: {
  featured: TmdbMovieSummary[];
  trendingRow: TmdbMovieSummary[];
  filter: MediaFilter;
}) {
  const { t } = useTranslation();

  return (
    <>
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
        eyebrow={filterEyebrow(
          filter,
          t("discover.eyebrowAll"),
          t("discover.eyebrowMovies"),
          t("discover.eyebrowSeries"),
        )}
        data={trendingRow}
        keyExtractor={keyOf}
        visibleCards={2.2}
        impressionSource="trending"
        impressionItem={impressionRef}
        renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
      />
    </>
  );
}

export function SearchDiscoverAvailabilityShelves({
  hasPlatforms,
  isLoadingPlatforms,
  availableMedia,
}: {
  hasPlatforms: boolean;
  isLoadingPlatforms: boolean;
  availableMedia: AvailableEntry[];
}) {
  const { t } = useTranslation();
  const availableShort = availableMedia.filter((entry) => entry.isShort);

  if (!hasPlatforms) return isLoadingPlatforms ? null : <PlatformsPrompt />;

  return (
    <>
      <Shelf
        title={t("discover.availableOnYourServices")}
        eyebrow={t("discover.availableEyebrow")}
        data={availableMedia}
        keyExtractor={keyOf}
        visibleCards={2.2}
        impressionSource="availability"
        impressionItem={impressionRef}
        renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
      />
      <Shelf
        title={t("discover.shortAndAvailable")}
        eyebrow={t("discover.shortAndAvailableEyebrow")}
        data={availableShort}
        keyExtractor={keyOf}
        visibleCards={2.2}
        impressionSource="availability"
        impressionItem={impressionRef}
        renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
      />
    </>
  );
}

export function SearchDiscoverTopTenShelf({ topTen }: { topTen: TmdbMovieSummary[] }) {
  const { t } = useTranslation();

  return (
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
  );
}

export function SearchDiscoverLibraryShelves({
  newReleases,
  genres,
  filter,
}: {
  newReleases: TmdbMovieSummary[];
  genres: GenreShelf[];
  filter: MediaFilter;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Shelf
        title={t("discover.newReleasesTitle")}
        subtitle={filterEyebrow(
          filter,
          t("discover.freshAll"),
          t("discover.freshMovies"),
          t("discover.freshSeries"),
        )}
        data={newReleases}
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
          data={genre.media}
          keyExtractor={keyOf}
          visibleCards={2.2}
          impressionSource="content"
          impressionItem={impressionRef}
          renderItem={(media, _index, cardWidth) => <PosterCard movie={media} width={cardWidth} />}
        />
      ))}
    </>
  );
}
