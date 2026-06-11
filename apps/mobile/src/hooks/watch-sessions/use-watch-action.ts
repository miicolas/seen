import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert } from "react-native";

import { useCurrentSession } from "@/hooks/watch-sessions/use-current-session";
import { useStartSession } from "@/hooks/watch-sessions/use-start-session";
import { EdenApiError } from "@/lib/eden";
import { formatRuntime } from "@/lib/format";
import { nowWatchingHref } from "@/lib/navigation";
import type { StartWatchSessionInput } from "@/services/watch-sessions";

const MANUAL_DURATION_MINUTES = [30, 45, 60, 90, 120, 150, 180];

export interface WatchActionParams {
  mediaType: "movie" | "episode";
  tmdbId: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTmdbId?: number;
  runtimeMinutes?: number | null;
}

// Start-or-resume behavior behind any "watch" control: starts a session (asking
// for a manual duration when TMDB has none) and opens the Now Watching sheet,
// or resumes the matching active session.
export function useWatchAction({
  mediaType,
  tmdbId,
  seasonNumber,
  episodeNumber,
  episodeTmdbId,
  runtimeMinutes,
}: WatchActionParams) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: current } = useCurrentSession();
  const start = useStartSession();

  const isResume =
    !!current &&
    current.media_type === mediaType &&
    current.tmdb_id === tmdbId &&
    (mediaType === "movie" ||
      (current.season_number === seasonNumber && current.episode_number === episodeNumber));

  async function startAndOpen(input: StartWatchSessionInput) {
    try {
      const session = await start.mutateAsync(input);
      router.push(nowWatchingHref(session.id));
    } catch (error) {
      if (error instanceof EdenApiError && error.code === "DURATION_REQUIRED") {
        promptManualDuration(input);
        return;
      }
      Alert.alert(t("watch.startError"));
    }
  }

  function promptManualDuration(input: StartWatchSessionInput) {
    const labels = MANUAL_DURATION_MINUTES.map((minutes) => formatRuntime(minutes)!);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: t("watch.setDurationTitle"),
        options: [...labels, t("watch.cancel")],
        cancelButtonIndex: labels.length,
      },
      (index) => {
        if (index == null || index >= labels.length) return;
        void startAndOpen({ ...input, duration_seconds: MANUAL_DURATION_MINUTES[index]! * 60 });
      },
    );
  }

  function onPress() {
    if (isResume && current && current.me.status === "active") {
      router.push(nowWatchingHref(current.id));
      return;
    }
    void startAndOpen({
      media_type: mediaType,
      tmdb_id: tmdbId,
      ...(mediaType === "episode"
        ? {
            season_number: seasonNumber,
            episode_number: episodeNumber,
            ...(episodeTmdbId ? { episode_tmdb_id: episodeTmdbId } : {}),
          }
        : {}),
    });
  }

  const caption = isResume ? t("watch.resume") : (formatRuntime(runtimeMinutes) ?? t("watch.watch"));

  return { onPress, loading: start.isPending, caption, isResume };
}
