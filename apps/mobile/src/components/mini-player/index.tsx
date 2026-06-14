import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { Text } from "@/components/ui/text";
import { BORDER_RADIUS, SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useSessionMutations } from "@/hooks/watch-sessions/use-session-mutations";
import { useTickingPosition } from "@/hooks/watch-sessions/use-ticking-position";
import { hapticTap } from "@/lib/haptics";
import { formatRuntime } from "@/lib/format";
import { nowWatchingHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb/images";
import type { WatchSession } from "@/services/watch-sessions";

export function MiniPlayer({ session }: { session: WatchSession }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { accentHex } = useAccentColor();
  const { width } = useWindowDimensions();
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { pause, resume } = useSessionMutations(session.id);

  const isPlaying = session.me.status === "active";
  const position = useTickingPosition(session.me);
  const progress = session.duration_seconds > 0 ? position / session.duration_seconds : 0;
  const remainingLabel = t("watch.left", {
    time: formatRuntime(Math.max(Math.ceil((session.duration_seconds - position) / 60), 1)),
  });

  function togglePlayback() {
    hapticTap();
    if (isPlaying) pause.mutate();
    else resume.mutate();
  }

  const compact = placement === "inline";
  const playerWidth = compact ? Math.min(width - 96, 260) : Math.min(width - SPACING.MD * 2, 420);

  return (
    <Pressable
      style={[styles.row, { width: playerWidth }, compact && styles.rowCompact]}
      accessibilityLabel={t("watch.screenTitle")}
      onPress={() => router.push(nowWatchingHref(session.id))}>
      <Image
        source={{ uri: tmdbImageUrl(session.poster_path, "w154") }}
        style={[styles.poster, compact && styles.posterCompact]}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.info}>
        <Text size="sm" weight="semibold" numberOfLines={1} inline>
          {session.title}
        </Text>
        {compact ? null : (
          <Text size="xs" weight="medium" color="#8E8E93" numberOfLines={1} inline>
            {remainingLabel}
          </Text>
        )}
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: accentHex },
            ]}
          />
        </View>
      </View>
      <Pressable
        style={styles.playButton}
        accessibilityLabel={isPlaying ? t("watch.pause") : t("watch.play")}
        hitSlop={SPACING.SM}
        onPress={togglePlayback}>
        <SymbolView
          name={isPlaying ? "pause.fill" : "play.fill"}
          size={22}
          type="monochrome"
          tintColor={accentHex}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 44,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rowCompact: {
    height: 38,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  poster: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: "#00000022",
  },
  posterCompact: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: "center",
  },
  track: {
    height: 2,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "#7878805C",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.FULL,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: "#78788024",
    alignItems: "center",
    justifyContent: "center",
  },
});
