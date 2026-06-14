import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { DiscoverSkeleton } from "@/components/discover/discover-skeleton";
import { SPACING } from "@/constants/design-tokens";
import { useNotInterestedList } from "@/hooks/not-interested/use-not-interested-list";
import { useMyPlatforms } from "@/hooks/platforms/use-my-platforms";
import { useAvailableFeed } from "@/hooks/recommendations/use-available-feed";
import { useFeed } from "@/hooks/recommendations/use-feed";
import { useDiscoverMedia } from "@/hooks/tmdb/use-discover-media";
import { useAccentColor } from "@/hooks/use-accent-color";
import type { MediaFilter, MediaType, TmdbMovieSummary } from "@/lib/tmdb";
import type { FeedSection, ResumeEntry } from "@/services/recommendations";

import { FeedSectionShelf } from "../home/feed-section-shelf";
import { FriendsWatchedShelf } from "../home/friends-watched-shelf";
import { ResumeShelf } from "../home/resume-shelf";
import {
  SearchDiscoverAvailabilityShelves,
  SearchDiscoverLeadShelves,
  SearchDiscoverLibraryShelves,
  SearchDiscoverTopTenShelf,
} from "./search-discover-shelves";
import { InlineEmptyState, InlineMessage, WarmUpPrompt } from "./search-empty-states";

const PERSONAL_BATCH_SIZE = 2;

function matchesFilter(mediaType: MediaType | ResumeEntry["media_type"], filter: MediaFilter) {
  if (filter === "all") return true;
  if (filter === "movie") return mediaType === "movie";
  return mediaType === "tv" || mediaType === "episode";
}

function notInterestedType(mediaType: ResumeEntry["media_type"]): MediaType {
  return mediaType === "episode" ? "tv" : mediaType;
}

function sectionKey(section: FeedSection) {
  return `${section.key}-${section.anchorTitle ?? ""}`;
}

export function SearchFeed({ filter, bottomInset }: { filter: MediaFilter; bottomInset: number }) {
  const { t } = useTranslation();
  const { accentHex } = useAccentColor();
  const feed = useFeed();
  const discover = useDiscoverMedia(filter);
  const myPlatforms = useMyPlatforms();
  const hasPlatforms = (myPlatforms.data?.providers.length ?? 0) > 0;
  const available = useAvailableFeed({ filter, enabled: hasPlatforms });
  const { isDismissed } = useNotInterestedList();

  const filterDismissed = (media: TmdbMovieSummary) => !isDismissed(media.id, media.media_type);
  const sections = (feed.data?.sections ?? [])
    .map((section) => ({
      ...section,
      entries: section.entries.filter(
        (entry) => matchesFilter(entry.media_type, filter) && filterDismissed(entry),
      ),
    }))
    .filter((section) => section.entries.length > 0);

  const resume = (feed.data?.resume ?? []).filter(
    (entry) =>
      matchesFilter(entry.media_type, filter) &&
      !isDismissed(entry.tmdb_id, notInterestedType(entry.media_type)),
  );
  const friendsWatched = (feed.data?.friendsRecentlyWatched ?? []).filter(
    (entry) => matchesFilter(entry.media_type, filter) && filterDismissed(entry),
  );
  const todaySection = sections.find((section) => section.key === "today");
  const personalSections = sections.filter((section) => section.key !== "today");
  const firstPersonal = personalSections.slice(0, PERSONAL_BATCH_SIZE);
  const nextPersonal = personalSections.slice(PERSONAL_BATCH_SIZE, PERSONAL_BATCH_SIZE * 2);
  const remainingPersonal = personalSections.slice(PERSONAL_BATCH_SIZE * 2);
  const hasPersonalContent = sections.length > 0 || resume.length > 0 || friendsWatched.length > 0;

  const visibleTrending = discover.trending.filter(filterDismissed);
  const featured = visibleTrending.slice(0, 5);
  const trendingRow = visibleTrending.slice(5);
  const availableMedia = available.data.filter(filterDismissed);
  const topTen = discover.topToday.filter(filterDismissed).slice(0, 10);
  const newReleases = discover.newReleases.filter(filterDismissed);
  const genres = discover.genres.map((genre) => ({
    key: genre.key,
    name: genre.name,
    media: genre.media.filter(filterDismissed),
  }));

  const discoverStatus = discover.isOffline ? (
    <InlineEmptyState
      icon="wifi.slash"
      title={t("discover.offlineTitle")}
      subtitle={t("discover.offlineSubtitle")}
    />
  ) : discover.isLoading ? (
    <DiscoverSkeleton />
  ) : discover.error ? (
    <InlineMessage>{discover.error}</InlineMessage>
  ) : null;

  function refresh() {
    void feed.refresh();
    discover.refetch();
    if (hasPlatforms) available.refetch();
  }

  function renderSection(section: FeedSection) {
    return <FeedSectionShelf key={sectionKey(section)} section={section} />;
  }

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={feed.isRefetching} onRefresh={refresh} tintColor={accentHex} />
      }
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}>
      {feed.isLoading && !feed.data ? (
        <DiscoverSkeleton />
      ) : (
        <>
          {todaySection ? renderSection(todaySection) : null}
          <ResumeShelf entries={resume} />
          <FriendsWatchedShelf entries={friendsWatched} />
          {!hasPersonalContent && !feed.error ? <WarmUpPrompt /> : null}
          {feed.error ? <InlineMessage>{t("home.loadError")}</InlineMessage> : null}

          {discoverStatus ?? (
            <SearchDiscoverLeadShelves
              featured={featured}
              trendingRow={trendingRow}
              filter={filter}
            />
          )}

          {firstPersonal.map(renderSection)}

          {!discoverStatus ? (
            <SearchDiscoverAvailabilityShelves
              hasPlatforms={hasPlatforms}
              isLoadingPlatforms={myPlatforms.isLoading}
              availableMedia={availableMedia}
            />
          ) : null}

          {nextPersonal.map(renderSection)}

          {!discoverStatus ? <SearchDiscoverTopTenShelf topTen={topTen} /> : null}

          {remainingPersonal.map(renderSection)}

          {!discoverStatus ? (
            <SearchDiscoverLibraryShelves
              newReleases={newReleases}
              genres={genres}
              filter={filter}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
  content: {
    gap: SPACING.LG,
    paddingTop: SPACING.SM,
  },
});
