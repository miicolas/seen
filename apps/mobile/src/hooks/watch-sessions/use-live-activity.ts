import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { addUserInteractionListener } from "expo-widgets";

import { useSessionMutations } from "@/hooks/watch-sessions/use-session-mutations";
import { formatRuntime } from "@/lib/format";
import { endLiveActivity, startOrUpdateLiveActivity } from "@/lib/live-activity";
import { cacheWidgetPosterImage } from "@/lib/widget-image-cache";
import { participantRemainingSeconds } from "@/lib/watch-session-position";
import type { WatchSession } from "@/services/watch-sessions";

const NOW_WATCHING_TOGGLE_TARGET = "now-watching.toggle-playback";

export function useLiveActivity(session: WatchSession | null | undefined) {
  const { t } = useTranslation();
  const { pause, resume } = useSessionMutations(session?.id);
  // The poster URI is constant per poster path; remember it so session refreshes
  // don't redo the file-cache round trip and a second activity update.
  const posterRef = useRef<{ path: string | null; uri: string | null } | null>(null);

  useEffect(() => {
    if (!session || session.status !== "active" || session.me.status === "completed") {
      void endLiveActivity();
      return;
    }
    const remainingMinutes = Math.max(Math.ceil(participantRemainingSeconds(session.me) / 60), 1);
    const subtitleParts = [
      session.media_type === "episode" && session.season_number != null
        ? `S${session.season_number} · E${session.episode_number}`
        : null,
      session.watching_with ? t("watch.watchingWith", { name: session.watching_with }) : null,
    ].filter(Boolean);

    const url = `seen://now-watching?sessionId=${session.id}`;
    const cachedPoster =
      posterRef.current?.path === session.poster_path ? posterRef.current.uri : undefined;
    const content = {
      title: session.title,
      subtitle: subtitleParts.join(" — "),
      remainingLabel: t("watch.left", { time: formatRuntime(remainingMinutes) }),
      isPlaying: session.me.status === "active",
      ...(cachedPoster ? { posterUri: cachedPoster } : {}),
    };

    startOrUpdateLiveActivity(session.id, content, url);
    if (cachedPoster !== undefined) return;

    let isCancelled = false;
    void cacheWidgetPosterImage(session.poster_path).then((posterUri) => {
      posterRef.current = { path: session.poster_path, uri: posterUri ?? null };
      if (isCancelled || !posterUri) return;
      startOrUpdateLiveActivity(session.id, { ...content, posterUri }, url);
    });

    return () => {
      isCancelled = true;
    };
  }, [session, t]);

  useEffect(() => {
    const subscription = addUserInteractionListener((event) => {
      if (event.source !== "NowWatchingActivity" || event.target !== NOW_WATCHING_TOGGLE_TARGET) {
        return;
      }
      if (!session || pause.isPending || resume.isPending) return;

      if (session.me.status === "active") {
        pause.mutate();
      } else if (session.me.status === "paused") {
        resume.mutate();
      }
    });

    return () => subscription.remove();
  }, [pause, resume, session]);
}
