import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { PressableScale } from "pressto";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { Text } from "@/components/ui/text";
import {
  BORDER_RADIUS,
  LINE_HEIGHT,
  SPACING,
} from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { tmdbImageUrl, type TmdbTvEpisodeSummary } from "@/lib/tmdb";

import { formatEpisodeDate } from "./utils";

// Small pill used for runtime, community average, and the user's own rating.
function MetricPill({
  icon,
  iconSize = 12,
  label,
  tint,
  background,
}: {
  icon: SFSymbol;
  iconSize?: number;
  label: string;
  tint: string;
  background: string;
}) {
  return (
    <View style={[styles.metricPill, { backgroundColor: background }]}>
      <SymbolView
        name={icon}
        size={iconSize}
        type="monochrome"
        tintColor={tint}
      />
      <Text size="xs" weight="bold" color={tint}>
        {label}
      </Text>
    </View>
  );
}

interface EpisodeRowProps {
  accentHex: string;
  episode: TmdbTvEpisodeSummary;
  fallbackImageUri?: string | null;
  onPress: () => void;
  showDivider: boolean;
  avg?: number; // community average, display stars 0.5..5
  ratingCount?: number;
  myRating?: number; // signed-in user's rating, display stars 0.5..5
}

export function EpisodeRow({
  accentHex,
  episode,
  fallbackImageUri,
  onPress,
  showDivider,
  avg,
  ratingCount = 0,
  myRating,
}: EpisodeRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const stillUri = tmdbImageUrl(episode.still_path, "w300") ?? fallbackImageUri;
  const title = `${episode.episode_number}. ${
    episode.name ?? t("mediaDetail.untitled")
  }`;
  const overview = episode.overview?.trim();
  const duration = episode.runtime ? `${episode.runtime}m` : undefined;
  const date = formatEpisodeDate(episode.air_date);

  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={StyleSheet.flatten([
        styles.episodeRow,
        showDivider
          ? {
              borderBottomColor: theme.backgroundSelected,
              borderBottomWidth: StyleSheet.hairlineWidth,
            }
          : null,
      ])}
    >
      <Image
        source={stillUri ? { uri: stillUri } : undefined}
        style={[styles.episodeImage, { backgroundColor: theme.backgroundElement }]}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.episodeBody}>
        <View style={styles.dateSlot}>
          {date ? (
            <Text
              size="xs"
              weight="semibold"
              color={theme.textSecondary}
              fillWidth
              numberOfLines={1}
            >
              {date}
            </Text>
          ) : null}
        </View>
        <Text size="md" weight="bold" color={theme.text} fillWidth numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.overviewSlot}>
          {overview ? (
            <Text
              size="sm"
              weight="regular"
              color={theme.textSecondary}
              fillWidth
              numberOfLines={2}
            >
              {overview}
            </Text>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          {duration ? (
            <MetricPill
              icon="play.fill"
              label={duration}
              tint={accentHex}
              background={theme.backgroundElement}
            />
          ) : null}

          {avg != null && ratingCount > 0 ? (
            <MetricPill
              icon="star.fill"
              label={avg.toFixed(1)}
              tint={accentHex}
              background={theme.backgroundElement}
            />
          ) : null}

          {myRating != null ? (
            <MetricPill
              icon="person.fill"
              iconSize={11}
              label={myRating.toFixed(1)}
              tint={theme.textSecondary}
              background={theme.backgroundElement}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.chevronSlot}>
        <SymbolView
          name="chevron.forward"
          size={16}
          type="monochrome"
          tintColor={theme.textSecondary}
        />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  episodeRow: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  episodeImage: {
    width: 104,
    height: 68,
    borderRadius: BORDER_RADIUS.SM,
    borderCurve: "continuous",
  },
  episodeBody: {
    flex: 1,
    gap: SPACING.XS,
  },
  dateSlot: {
    height: LINE_HEIGHT.XS,
  },
  overviewSlot: {
    height: LINE_HEIGHT.SM * 2,
  },
  metaRow: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
  metricPill: {
    alignSelf: "flex-start",
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: BORDER_RADIUS.FULL,
  },
  chevronSlot: {
    width: 20,
    height: LINE_HEIGHT.MD,
    alignItems: "center",
    justifyContent: "center",
  },
});
