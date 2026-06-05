import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { HorizontalScrollRow } from "@/components/ui/horizontal-scroll-row";
import { PillButton } from "@/components/ui/pill-button";
import { Text } from "@/components/ui/text";
import { useSeasonEpisodeStats } from "@/hooks/reviews/use-season-episode-stats";
import { useTheme } from "@/hooks/use-theme";
import { useTvSeasonDetail } from "@/hooks/tmdb/use-tv-season-detail";
import { hapticSelection, hapticTap } from "@/lib/haptics";
import { episodeDetailHref } from "@/lib/navigation";
import type { TmdbTvEpisodeSummary, TmdbTvSeasonSummary } from "@/lib/tmdb";

import { DetailSection } from "../detail-section";
import { EpisodeRow } from "./episode-row";
import { normalizeSeasons } from "./utils";

interface EpisodesSectionProps {
  seriesId: number;
  seriesTitle: string;
  seasons: TmdbTvSeasonSummary[];
  posterPath?: string | null;
  posterUri?: string | null;
  accentHex: string;
}

export function EpisodesSection({
  seriesId,
  seriesTitle,
  seasons,
  posterPath,
  posterUri,
  accentHex,
}: EpisodesSectionProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const seasonOptions = useMemo(() => normalizeSeasons(seasons), [seasons]);
  const defaultSeason = useMemo(
    () =>
      seasonOptions.find((season) => season.season_number > 0)?.season_number ??
      seasonOptions[0]?.season_number ??
      null,
    [seasonOptions],
  );
  const [selection, setSelection] = useState<{
    seriesId: number;
    seasonNumber: number;
  } | null>(null);
  const selectedSeason =
    selection?.seriesId === seriesId &&
    seasonOptions.some((season) => season.season_number === selection.seasonNumber)
      ? selection.seasonNumber
      : defaultSeason;

  const { season, isLoading, error } = useTvSeasonDetail(seriesId, selectedSeason);
  const episodes = season?.episodes ?? [];
  const { statsByEpisode, myRatingByEpisode } = useSeasonEpisodeStats(seriesId, selectedSeason);

  if (seasonOptions.length === 0) return null;

  function selectSeason(seasonNumber: number) {
    hapticSelection();
    setSelection({ seriesId, seasonNumber });
  }

  function openEpisode(episode: TmdbTvEpisodeSummary) {
    hapticTap();
    router.push(
      episodeDetailHref({
        seriesId,
        episodeTmdbId: episode.id,
        seasonNumber: episode.season_number,
        episodeNumber: episode.episode_number,
        seriesTitle,
        episodeTitle: episode.name,
        poster_path: posterPath,
        still_path: episode.still_path,
      }),
    );
  }

  return (
    <DetailSection title={t("mediaDetail.episodes")}>
      <HorizontalScrollRow edgeToEdge>
        {seasonOptions.map((seasonItem) => (
          <PillButton
            key={seasonItem.season_number}
            label={
              seasonItem.season_number === 0
                ? t("mediaDetail.bonus")
                : `S${seasonItem.season_number}`
            }
            selected={seasonItem.season_number === selectedSeason}
            onPress={() => selectSeason(seasonItem.season_number)}
            accentHex={accentHex}
          />
        ))}
      </HorizontalScrollRow>

      {episodes.length > 0 ? (
        <View style={[styles.episodeList, { borderTopColor: theme.backgroundSelected }]}>
          {episodes.map((episode, index) => {
            const stat = statsByEpisode.get(episode.episode_number);
            return (
              <EpisodeRow
                accentHex={accentHex}
                episode={episode}
                fallbackImageUri={posterUri}
                key={`${episode.season_number}-${episode.episode_number}`}
                onPress={() => openEpisode(episode)}
                showDivider={index < episodes.length - 1}
                avg={stat?.avg}
                ratingCount={stat?.ratingCount}
                myRating={myRatingByEpisode.get(episode.episode_number)}
              />
            );
          })}
        </View>
      ) : null}

      {isLoading && episodes.length === 0 ? (
        <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
          {t("mediaDetail.loadingEpisodes")}
        </Text>
      ) : null}

      {error && !isLoading && episodes.length === 0 ? (
        <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
          {error}
        </Text>
      ) : null}

      {!isLoading && !error && selectedSeason != null && episodes.length === 0 ? (
        <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
          {t("mediaDetail.noEpisodes")}
        </Text>
      ) : null}
    </DetailSection>
  );
}

const styles = StyleSheet.create({
  episodeList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
