import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { formatRuntime } from "@/lib/format";
import { endLiveActivity, startOrUpdateLiveActivity } from "@/lib/live-activity";
import { participantRemainingSeconds } from "@/lib/watch-session-position";
import type { WatchSession } from "@/services/watch-sessions";

export function useLiveActivity(session: WatchSession | null | undefined) {
  const { t } = useTranslation();

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

    startOrUpdateLiveActivity(
      session.id,
      {
        title: session.title,
        subtitle: subtitleParts.join(" — "),
        remainingLabel: t("watch.left", { time: formatRuntime(remainingMinutes) }),
        isPlaying: session.me.status === "active",
      },
      `seen://now-watching?sessionId=${session.id}`,
    );
  }, [session, t]);
}
