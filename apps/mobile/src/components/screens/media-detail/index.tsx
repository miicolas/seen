import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/navigation";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";

import { CastSection } from "./cast-section";
import { EpisodesSection } from "./episodes-section";
import { InfoSection } from "./info-section";
import { MediaActions } from "./media-actions";
import { MediaParallaxHeader } from "./media-parallax-header";
import { MediaSummary } from "./media-summary";
import { OverviewSection } from "./overview-section";
import { RatingsSection } from "./ratings-section";
import { useMediaDetailViewModel } from "./use-media-detail-view-model";

export function MediaDetail() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const vm = useMediaDetailViewModel();

  const handleRate = useCallback(() => vm.openReview(vm.myStars || undefined), [vm]);

  return (
    <>
      <ScreenHeader />
      <Stack.Title>{vm.title}</Stack.Title>

      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <MediaParallaxHeader
          backdropUri={vm.backdropUri}
          posterUri={vm.posterUri}
          headerHeight={370}
          bottomInset={insets.bottom}>
          <MediaSummary
            title={vm.title}
            tagline={vm.tagline}
            year={vm.year}
            runtime={vm.runtime}
            genres={vm.genres}
            myStars={vm.myStars}
            hasReview={vm.hasReview}
          />

          {vm.mediaType === "movie" ? (
            <MediaActions hasRating={vm.hasRating} accentHex={vm.accentHex} onRate={handleRate} />
          ) : null}

          {vm.error && !vm.detail ? (
            <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
              {vm.error}
            </Text>
          ) : null}

          <OverviewSection overview={vm.detail?.overview} />

          {vm.mediaType === "tv" ? (
            <EpisodesSection
              seriesId={vm.tmdbId}
              seriesTitle={vm.title}
              seasons={vm.seasons}
              posterPath={vm.posterPath}
              posterUri={vm.posterUri}
              accentHex={vm.accentHex}
            />
          ) : null}

          <CastSection cast={vm.cast} />

          <InfoSection rows={vm.infoRows} />

          <RatingsSection
            title={
              vm.mediaType === "tv"
                ? t("mediaDetail.episodeRatings")
                : t("mediaDetail.ratingsAndReviews")
            }
            stats={vm.stats}
            accentHex={vm.accentHex}
            reviews={vm.reviews}
            reviewCount={vm.reviewCount}
            onOpenReviews={vm.openReviews}
          />

          {vm.isLoading && !vm.detail ? (
            <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
              Loading…
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
