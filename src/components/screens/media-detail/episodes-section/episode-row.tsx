import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import {
  BORDER_RADIUS,
  LINE_HEIGHT,
  OPACITY,
  SPACING,
} from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { tmdbImageUrl, type TmdbTvEpisodeSummary } from "@/lib/tmdb";

import { formatEpisodeDate } from "./utils";

interface EpisodeRowProps {
  accentHex: string;
  episode: TmdbTvEpisodeSummary;
  fallbackImageUri?: string | null;
  onPress: () => void;
  showDivider: boolean;
}

export function EpisodeRow({
  accentHex,
  episode,
  fallbackImageUri,
  onPress,
  showDivider,
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.episodeRow,
        showDivider
          ? {
              borderBottomColor: theme.backgroundSelected,
              borderBottomWidth: StyleSheet.hairlineWidth,
            }
          : null,
        pressed ? { opacity: OPACITY.PRESSED } : null,
      ]}
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
        <View style={styles.durationSlot}>
          {duration ? (
            <View
              style={[
                styles.durationPill,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <View style={styles.playIconSlot}>
                <SymbolView
                  name="play.fill"
                  size={12}
                  type="monochrome"
                  tintColor={accentHex}
                />
              </View>
              <Text size="xs" weight="bold" color={accentHex}>
                {duration}
              </Text>
            </View>
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
    </Pressable>
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
  durationSlot: {
    height: 30,
    justifyContent: "center",
  },
  durationPill: {
    alignSelf: "flex-start",
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: BORDER_RADIUS.FULL,
  },
  playIconSlot: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronSlot: {
    width: 20,
    height: LINE_HEIGHT.MD,
    alignItems: "center",
    justifyContent: "center",
  },
});
