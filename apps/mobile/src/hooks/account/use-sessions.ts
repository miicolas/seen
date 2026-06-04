import { accountKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import {
  type AccountSession,
  listMySessions,
  revokeOtherSessions,
  revokeSession,
} from "@/services/account";

export type SessionRow = AccountSession & { isCurrent: boolean };

export function useSessions() {
  const queryClient = useQueryClient();
  const { session } = useAuthContext();
  const currentToken = session?.token ?? null;

  const query = useQuery({
    queryKey: accountKeys.sessions(),
    queryFn: listMySessions,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: accountKeys.sessions() });

  const revoke = useMutation({
    mutationFn: (token: string) => revokeSession(token),
    onSuccess: invalidate,
  });
  const revokeOthers = useMutation({
    mutationFn: () => revokeOtherSessions(),
    onSuccess: invalidate,
  });

  const sessions: SessionRow[] = (query.data ?? []).map((row) => ({
    ...row,
    isCurrent: currentToken != null && row.token === currentToken,
  }));

  return {
    sessions,
    isLoading: query.isLoading,
    error: query.error
      ? errorMessage(query.error, "Couldn't load your sessions.")
      : null,
    refetch: query.refetch,
    revoke: (token: string) => revoke.mutateAsync(token),
    revokeOthers: () => revokeOthers.mutateAsync(),
    isMutating: revoke.isPending || revokeOthers.isPending,
  };
}
