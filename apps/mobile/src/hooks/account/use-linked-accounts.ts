import { accountKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { authClient } from "@/lib/auth-client";
import { listMyLinkedAccounts, unlinkAccount } from "@/services/account";

export function useLinkedAccounts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: accountKeys.linked(),
    queryFn: listMyLinkedAccounts,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: accountKeys.linked() });

  const unlink = useMutation({
    mutationFn: (providerId: string) => unlinkAccount({ providerId }),
    onSuccess: invalidate,
  });

  const accounts = query.data ?? [];
  const hasCredential = accounts.some(
    (account) => account.provider_id === "credential",
  );
  const canUnlink = accounts.length > 1;

  return {
    accounts,
    hasCredential,
    canUnlink,
    isLoading: query.isLoading,
    error: query.error
      ? errorMessage(query.error, "Couldn't load your linked accounts.")
      : null,
    refetch: query.refetch,
    unlink: (providerId: string) => unlink.mutateAsync(providerId),
    link: (provider: "apple") =>
      authClient.linkSocial({ provider, callbackURL: "/" }),
    isMutating: unlink.isPending,
  };
}
