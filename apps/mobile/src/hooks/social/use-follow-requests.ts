import { socialKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { errorMessage } from "@/lib/format";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import {
  approveAllFollowRequests,
  approveFollowRequest,
  getFollowRequests,
  rejectFollowRequest,
  type FollowRequest,
} from "@/services/social";

import { useInvalidateSocial } from "./use-invalidate-social";

// Incoming follow requests addressed to the current user, plus the approve /
// reject / approve-all actions. Approve and reject optimistically drop the row so
// acting on one request never blocks the others, then reconcile via a targeted
// social refresh.
export function useFollowRequests() {
  const queryClient = useQueryClient();
  const invalidateSocial = useInvalidateSocial();

  const query = useQuery({
    queryKey: socialKeys.requests(),
    queryFn: () => getFollowRequests(),
  });

  const removeOptimistically = useCallback(
    async (requestId: string) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.requests() });
      const previous = queryClient.getQueryData<FollowRequest[]>(socialKeys.requests());
      queryClient.setQueryData<FollowRequest[]>(socialKeys.requests(), (current) =>
        (current ?? []).filter((request) => request.id !== requestId),
      );
      return { previous };
    },
    [queryClient],
  );

  const restore = useCallback(
    (context: { previous?: FollowRequest[] } | undefined) => {
      hapticError();
      if (context?.previous) {
        queryClient.setQueryData(socialKeys.requests(), context.previous);
      }
    },
    [queryClient],
  );

  const approve = useMutation({
    mutationFn: (requestId: string) => approveFollowRequest(requestId),
    onMutate: removeOptimistically,
    onError: (_error, _requestId, context) => restore(context),
    onSuccess: () => hapticSuccess(),
    onSettled: invalidateSocial,
  });

  const reject = useMutation({
    mutationFn: (requestId: string) => rejectFollowRequest(requestId),
    onMutate: removeOptimistically,
    onError: (_error, _requestId, context) => restore(context),
    onSettled: invalidateSocial,
  });

  const approveAll = useMutation({
    mutationFn: () => approveAllFollowRequests(),
    onSuccess: () => {
      hapticSuccess();
      invalidateSocial();
    },
    onError: () => hapticError(),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load requests.") : null,
    refetch: query.refetch,
    approve: approve.mutateAsync,
    reject: reject.mutateAsync,
    approveAll: approveAll.mutateAsync,
    // Only the bulk action disables the rows; single approve/reject taps drop their
    // own row optimistically, so they must not freeze the rest of the list.
    isApprovingAll: approveAll.isPending,
  };
}
