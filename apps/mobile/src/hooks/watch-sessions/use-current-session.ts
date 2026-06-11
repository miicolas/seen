import { watchSessionKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import { getCurrentWatchSession } from "@/services/watch-sessions";

const POLL_INTERVAL_MS = 12_000;

export function useCurrentSession() {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: watchSessionKeys.current(),
    queryFn: getCurrentWatchSession,
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: (query) => (query.state.data ? POLL_INTERVAL_MS : false),
  });
}
