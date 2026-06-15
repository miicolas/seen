import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader, ScreenToolbar } from "@/components/navigation";
import { Text } from "@/components/ui/text";
import { useMediaRouteBase } from "@/hooks/use-media-route-base";
import { useTheme } from "@/hooks/use-theme";
import { useWatchAction } from "@/hooks/watch-sessions/use-watch-action";

import { CastSection } from "../media-detail/cast-section";
import { InfoSection } from "../media-detail/info-section";
import { MediaActionBar } from "../media-detail/media-action-bar";
import { MediaParallaxHeader } from "../media-detail/media-parallax-header";
import { MediaSummary } from "../media-detail/media-summary";
import { OverviewSection } from "../media-detail/overview-section";
import { RatingsSection } from "../media-detail/ratings-section";
import { useEpisodeDetailViewModel } from "./use-episode-detail-view-model";

export function EpisodeDetail() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const base = useMediaRouteBase();
  const vm = useEpisodeDetailViewModel();

  const watchAction = useWatchAction({
    mediaType: "episode",
    tmdbId: vm.seriesId,
    seasonNumber: vm.seasonNumber,
    episodeNumber: vm.episodeNumber,
    episodeTmdbId: vm.episodeTmdbId > 0 ? vm.episodeTmdbId : undefined,
    runtimeMinutes: vm.runtimeMinutes,
  });

  return (
    <>
      <ScreenHeader />
      <Stack.Title>{vm.title}</Stack.Title>
      <ScreenToolbar
        placement="right"
        actions={[
          {
            key: "close",
            icon: "xmark",
            onPress: vm.handleClose,
            tintColor: "#ffffff",
          },
        ]}
      />

      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <MediaParallaxHeader
          backdropUri={vm.backdropUri}
          posterUri={vm.posterUri}
          headerHeight={370}
          bottomInset={insets.bottom}
          adaptToHero>
          <MediaSummary
            title={vm.title}
            tagline={vm.seriesTitle}
            year={vm.year}
            runtime={vm.runtime}
            genres={vm.episodeMeta}
            myStars={vm.myStars}
            hasReview={vm.hasReview}
          />

          <MediaActionBar
            accentHex={vm.accentHex}
            watch={{
              caption: watchAction.caption,
              onPress: watchAction.onPress,
              loading: watchAction.loading,
            }}
            rate={
              vm.episodeTmdbId > 0
                ? { caption: t("mediaDetail.seen"), onPress: vm.handleRate, active: vm.hasRating }
                : undefined
            }
          />

          {vm.error && !vm.hasEpisode ? (
            <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
              {vm.error}
            </Text>
          ) : null}

          <OverviewSection overview={vm.overview} />

          <RatingsSection
            title={t("mediaDetail.episodeRatings")}
            stats={vm.stats}
            accentHex={vm.accentHex}
            reviews={vm.reviews}
            reviewCount={vm.reviewCount}
            onOpenReviews={vm.openReviews}
          />

          <CastSection cast={vm.cast.slice(0, 16)} base={base} />

          <InfoSection rows={vm.infoRows} />

          {vm.isLoading && !vm.hasEpisode ? (
            <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
              {t("episode.loading")}
            </Text>
          ) : null}
        </MediaParallaxHeader>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
