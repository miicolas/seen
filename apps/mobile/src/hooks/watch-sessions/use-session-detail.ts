import { watchSessionKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { getWatchSessionDetail } from "@/services/watch-sessions";

const POLL_INTERVAL_MS = 12_000;

export function useSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: watchSessionKeys.detail(sessionId ?? "none"),
    queryFn: () => getWatchSessionDetail(sessionId!),
    enabled: !!sessionId,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
