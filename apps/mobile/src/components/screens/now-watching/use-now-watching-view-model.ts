import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert } from "react-native";

import { useAuthContext } from "@/hooks/use-auth-context";
import { useSessionDetail } from "@/hooks/watch-sessions/use-session-detail";
import { useSessionMutations } from "@/hooks/watch-sessions/use-session-mutations";
import { useTickingPosition } from "@/hooks/watch-sessions/use-ticking-position";
import { hapticDelete, hapticSelection, hapticSuccess, hapticTap } from "@/lib/haptics";
import { episodeReviewSheetHref, reviewSheetHref, watchInviteHref } from "@/lib/navigation";
import { tmdbImageUrl } from "@/lib/tmdb/images";

const SKIP_SECONDS = 30;

export function useNowWatchingViewModel() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthContext();

  const sessionId = typeof params.sessionId === "string" ? params.sessionId : undefined;
  const { data: detail, isLoading, error } = useSessionDetail(sessionId);
  const { pause, resume, seek, finish, cancel } = useSessionMutations(sessionId ?? "none");

  const me = detail?.me ?? null;
  const position = useTickingPosition(me);
  const duration = detail?.duration_seconds ?? 0;
  const isPlaying = me?.status === "active";
  const isHost = !!detail && detail.host_id === user?.id;
  const others = (detail?.participants ?? []).filter((row) => row.user_id !== me?.user_id);

  const subtitle =
    detail?.media_type === "episode" && detail.season_number != null
      ? `S${detail.season_number} · E${detail.episode_number}`
      : null;
  const watchingWith = others[0]?.full_name ?? null;

  const pendingInvitees = detail?.pending_invitations.map((row) => row.invitee) ?? [];
  const canInvite = isHost && others.length === 0;

  function togglePlay() {
    hapticTap();
    if (isPlaying) pause.mutate();
    else resume.mutate();
  }

  function skip(direction: 1 | -1) {
    hapticSelection();
    const target = Math.max(0, Math.min(position + direction * SKIP_SECONDS, duration));
    seek.mutate(target);
  }

  function seekTo(seconds: number) {
    hapticSelection();
    seek.mutate(seconds);
  }

  async function handleFinish() {
    if (!detail) return;
    try {
      await finish.mutateAsync();
      hapticSuccess();
      const href =
        detail.media_type === "movie"
          ? reviewSheetHref({
              id: detail.tmdb_id,
              mediaType: "movie",
              title: detail.title,
              poster_path: detail.poster_path,
            })
          : episodeReviewSheetHref({
              seriesId: detail.tmdb_id,
              episodeTmdbId: detail.episode_tmdb_id ?? 0,
              seasonNumber: detail.season_number ?? 0,
              episodeNumber: detail.episode_number ?? 0,
              title: detail.title,
              poster_path: detail.poster_path,
              mediaSubtitle: subtitle,
            });
      router.replace(href);
    } catch {
      Alert.alert(t("watch.loadError"));
    }
  }

  function openInvite() {
    if (!sessionId) return;
    hapticSelection();
    router.push(watchInviteHref(sessionId));
  }

  function openMenu() {
    if (!isHost) return;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: t("watch.cancelConfirmTitle"),
        message: t("watch.cancelConfirmBody"),
        options: [t("watch.cancelConfirmYes"), t("watch.cancelConfirmNo")],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
      },
      (index) => {
        if (index !== 0) return;
        hapticDelete();
        cancel.mutate(undefined, { onSuccess: () => router.back() });
      },
    );
  }

  return {
    detail,
    isLoading,
    error,
    me,
    others,
    position,
    duration,
    isPlaying,
    isHost,
    subtitle,
    watchingWith,
    pendingInvitees,
    canInvite,
    posterUri: tmdbImageUrl(detail?.poster_path, "w780"),
    isFinishing: finish.isPending,
    togglePlay,
    skip,
    seekTo,
    handleFinish,
    openInvite,
    openMenu,
    close: () => router.back(),
  };
}
