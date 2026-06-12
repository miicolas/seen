import { notInterestedKeys } from "@seen/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { useLibraryMemberships } from "@/hooks/library/use-library-memberships";
import { useMembershipsCache } from "@/hooks/library/use-memberships-cache";
import type { MediaType } from "@/lib/tmdb";
import { hasMembership } from "@/services/library";
import { dismiss, undismiss } from "@/services/not-interested";

interface NotInterestedMembershipState {
  isDismissed: boolean;
  isSaving: boolean;
  toggle: () => Promise<void>;
}

export function useNotInterestedMembership(
  tmdbId: number,
  mediaType: MediaType,
): NotInterestedMembershipState {
  const queryClient = useQueryClient();
  const { memberships } = useLibraryMemberships();
  const cache = useMembershipsCache();
  const invalidateAnalytics = useInvalidateAnalytics();
  const isDismissed = hasMembership(memberships, "not_interested", tmdbId, mediaType);

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notInterestedKeys.list() });
    invalidateAnalytics();
  }, [queryClient, invalidateAnalytics]);

  const dismissMutation = useMutation({
    mutationFn: () => dismiss({ tmdb_id: tmdbId, media_type: mediaType }),
    onMutate: async () => {
      const previous = await cache.begin();
      cache.add("not_interested", { tmdb_id: tmdbId, media_type: mediaType });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      cache.restore(context?.previous);
    },
    onSuccess: () => {
      invalidateList();
    },
  });

  const undismissMutation = useMutation({
    mutationFn: () => undismiss({ tmdbId, mediaType }),
    onMutate: async () => {
      const previous = await cache.begin();
      cache.remove("not_interested", { tmdb_id: tmdbId, media_type: mediaType });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      cache.restore(context?.previous);
    },
    onSuccess: () => {
      invalidateList();
    },
  });

  const toggle = useCallback(async () => {
    if (isDismissed) await undismissMutation.mutateAsync();
    else await dismissMutation.mutateAsync();
  }, [dismissMutation, isDismissed, undismissMutation]);

  return {
    isDismissed,
    isSaving: dismissMutation.isPending || undismissMutation.isPending,
    toggle,
  };
}
