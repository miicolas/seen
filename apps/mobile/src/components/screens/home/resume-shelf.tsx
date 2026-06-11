import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Shelf } from "@/components/discover/shelf";
import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { useTickingPosition } from "@/hooks/watch-sessions/use-ticking-position";
import { hapticTap } from "@/lib/haptics";
import { formatRuntime } from "@/lib/format";
import { nowWatchingHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb/images";
import type { ResumeEntry } from "@/services/recommendations";

export function ResumeShelf({ entries }: { entries: ResumeEntry[] }) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <Shelf
      title={t("home.sections.resume")}
      data={entries}
      keyExtractor={(entry) => entry.session_id}
      visibleCards={2.2}
      renderItem={(entry, _index, cardWidth) => <ResumeCard entry={entry} width={cardWidth} />}
    />
  );
}

function ResumeCard({ entry, width }: { entry: ResumeEntry; width: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accentHex } = useAccentColor();
  const position = useTickingPosition(entry);
  const fraction = entry.duration_seconds > 0 ? position / entry.duration_seconds : 0;
  const remainingMinutes = Math.max(Math.ceil((entry.duration_seconds - position) / 60), 1);

  const subtitle =
    entry.media_type === "episode" && entry.season_number != null
      ? `S${entry.season_number} · E${entry.episode_number}`
      : t("watch.left", { time: formatRuntime(remainingMinutes) });

  return (
    <Pressable
      style={[styles.card, { width }]}
      accessibilityLabel={entry.title}
      onPress={() => {
        hapticTap();
        router.push(nowWatchingHref(entry.session_id));
      }}>
      <View style={styles.posterWrap}>
        <Image
          source={{ uri: tmdbImageUrl(entry.poster_path, "w342") }}
          style={styles.poster}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(fraction * 100, 100)}%`, backgroundColor: accentHex },
            ]}
          />
        </View>
      </View>
      <Text size="sm" weight="semibold" numberOfLines={1} inline>
        {entry.title}
      </Text>
      <Text size="xs" weight="medium" color={theme.textSecondary} numberOfLines={1} inline>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.XS,
  },
  posterWrap: {
    borderRadius: BORDER_RADIUS.MD,
    overflow: "hidden",
    backgroundColor: "#00000022",
  },
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  fill: {
    height: "100%",
  },
});
