import { watchSessionKeys } from "@seen/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deriveParticipantPosition } from "@/lib/watch-session-position";
import {
  cancelWatchSession,
  finishWatchSession,
  pauseWatchSession,
  resumeWatchSession,
  seekWatchSession,
  type WatchParticipant,
  type WatchSession,
  type WatchSessionDetail,
} from "@/services/watch-sessions";

type ParticipantPatch = (me: WatchParticipant) => WatchParticipant;
type CacheSnapshot = {
  current: WatchSession | null | undefined;
  detail: WatchSessionDetail | undefined;
};

const nowIso = () => new Date().toISOString();

export function useSessionMutations(sessionId: string) {
  const queryClient = useQueryClient();
  const currentKey = watchSessionKeys.current();
  const detailKey = watchSessionKeys.detail(sessionId);

  const patchCaches = (patch: ParticipantPatch) => {
    queryClient.setQueryData<WatchSession | null>(currentKey, (session) =>
      session && session.id === sessionId ? { ...session, me: patch(session.me) } : session,
    );
    queryClient.setQueryData<WatchSessionDetail>(detailKey, (detail) => {
      if (!detail?.me) return detail;
      const me = patch(detail.me);
      return {
        ...detail,
        me,
        participants: detail.participants.map((row) => (row.user_id === me.user_id ? me : row)),
      };
    });
  };

  const restore = (context?: CacheSnapshot) => {
    if (!context) return;
    queryClient.setQueryData(currentKey, context.current);
    queryClient.setQueryData(detailKey, context.detail);
  };

  const applyServerSession = (session: WatchSession) => {
    queryClient.setQueryData<WatchSession | null>(currentKey, (existing) =>
      existing && existing.id !== session.id ? existing : session,
    );
    queryClient.setQueryData<WatchSessionDetail>(detailKey, (detail) =>
      detail && detail.me
        ? {
            ...detail,
            status: session.status,
            me: session.me,
            participants: detail.participants.map((row) =>
              row.user_id === session.me.user_id ? session.me : row,
            ),
          }
        : detail,
    );
  };

  const optimisticOptions = <TVars = void>(
    mutationFn: (variables: TVars) => Promise<WatchSession>,
    patch: (me: WatchParticipant, variables: TVars) => WatchParticipant,
  ) => ({
    mutationFn,
    onMutate: async (variables: TVars): Promise<CacheSnapshot> => {
      await queryClient.cancelQueries({ queryKey: watchSessionKeys.all() });
      const context: CacheSnapshot = {
        current: queryClient.getQueryData<WatchSession | null>(currentKey),
        detail: queryClient.getQueryData<WatchSessionDetail>(detailKey),
      };
      patchCaches((me) => patch(me, variables));
      return context;
    },
    onError: (_error: Error, _variables: TVars, context: CacheSnapshot | undefined) =>
      restore(context),
    onSuccess: applyServerSession,
  });

  const pause = useMutation(
    optimisticOptions(
      () => pauseWatchSession(sessionId),
      (me) => ({
        ...me,
        status: "paused",
        position_seconds: deriveParticipantPosition(me),
        last_progress_at: nowIso(),
      }),
    ),
  );

  const resume = useMutation(
    optimisticOptions(
      () => resumeWatchSession(sessionId),
      (me) => ({ ...me, status: "active", last_progress_at: nowIso() }),
    ),
  );

  const seek = useMutation(
    optimisticOptions(
      (positionSeconds: number) => seekWatchSession(sessionId, positionSeconds),
      (me, positionSeconds) => ({
        ...me,
        position_seconds: Math.max(0, Math.min(positionSeconds, me.duration_seconds)),
        last_progress_at: nowIso(),
      }),
    ),
  );

  const finish = useMutation({
    ...optimisticOptions(
      () => finishWatchSession(sessionId),
      (me) => ({
        ...me,
        status: "completed",
        position_seconds: deriveParticipantPosition(me),
        last_progress_at: nowIso(),
        completed_at: nowIso(),
      }),
    ),
    onSuccess: (session: WatchSession) => {
      applyServerSession(session);
      queryClient.invalidateQueries({ queryKey: currentKey });
    },
  });

  const cancel = useMutation({
    mutationFn: () => cancelWatchSession(sessionId),
    onSuccess: () => {
      queryClient.setQueryData(currentKey, null);
      queryClient.invalidateQueries({ queryKey: watchSessionKeys.all() });
    },
  });

  return { pause, resume, seek, finish, cancel };
}
