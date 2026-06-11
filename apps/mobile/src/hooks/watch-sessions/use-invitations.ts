import { watchSessionKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import { ensurePushRegistration } from "@/lib/push-notifications";
import {
  acceptWatchInvitation,
  declineWatchInvitation,
  listWatchInvitations,
} from "@/services/watch-sessions";

export function useInvitations() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const inbox = useQuery({
    queryKey: watchSessionKeys.invitations(),
    queryFn: listWatchInvitations,
    enabled: !!user,
    staleTime: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: watchSessionKeys.all() });
  };

  const accept = useMutation({
    mutationFn: ({
      invitationId,
      fromBeginning,
    }: {
      invitationId: string;
      fromBeginning: boolean;
    }) => acceptWatchInvitation(invitationId, fromBeginning),
    onSuccess: (session) => {
      queryClient.setQueryData(watchSessionKeys.current(), session);
      invalidate();
      void ensurePushRegistration();
    },
  });

  const decline = useMutation({
    mutationFn: (invitationId: string) => declineWatchInvitation(invitationId),
    onSuccess: invalidate,
  });

  return { inbox, accept, decline };
}
