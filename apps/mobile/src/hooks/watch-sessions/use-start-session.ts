import { watchSessionKeys } from "@seen/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { startWatchSession } from "@/services/watch-sessions";

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startWatchSession,
    onSuccess: (session) => {
      queryClient.setQueryData(watchSessionKeys.current(), session);
      queryClient.invalidateQueries({ queryKey: watchSessionKeys.all() });
    },
  });
}
