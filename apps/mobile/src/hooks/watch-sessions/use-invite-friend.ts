import { watchSessionKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ensurePushRegistration } from "@/lib/push-notifications";
import { inviteToWatchSession, listInvitableFriends } from "@/services/watch-sessions";

export function useInviteFriend(sessionId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  const friends = useQuery({
    queryKey: watchSessionKeys.invitableFriends(sessionId ?? "none"),
    queryFn: () => listInvitableFriends(sessionId!),
    enabled: !!sessionId && enabled,
  });

  const invite = useMutation({
    mutationFn: (inviteeId: string) => inviteToWatchSession(sessionId!, inviteeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: watchSessionKeys.invitableFriends(sessionId ?? "none"),
      });
      queryClient.invalidateQueries({ queryKey: watchSessionKeys.detail(sessionId ?? "none") });
      void ensurePushRegistration();
    },
  });

  return { friends, invite };
}
