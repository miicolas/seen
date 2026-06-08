import { notInterestedKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import type { MediaType } from "@/lib/tmdb";
import { dismiss, getMyItem, undismiss, type NotInterestedItem } from "@/services/not-interested";

interface NotInterestedMembershipState {
  item: NotInterestedItem | null;
  isDismissed: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  dismiss: () => Promise<void>;
  undismiss: () => Promise<void>;
  toggle: () => Promise<void>;
  refetch: () => void;
}

export function useNotInterestedMembership(
  tmdbId: number,
  mediaType: MediaType,
): NotInterestedMembershipState {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canLoad = !!user && Number.isFinite(tmdbId) && tmdbId > 0;
  const key = notInterestedKeys.my(mediaType, tmdbId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getMyItem({ tmdbId, mediaType }),
    enabled: canLoad,
  });
  const refetchQuery = query.refetch;

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notInterestedKeys.list() });
  }, [queryClient]);

  const dismissMutation = useMutation({
    mutationFn: () => dismiss({ tmdb_id: tmdbId, media_type: mediaType }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotInterestedItem | null>(key);
      queryClient.setQueryData<NotInterestedItem>(key, {
        id: "optimistic",
        user_id: user?.id ?? "",
        tmdb_id: tmdbId,
        media_type: mediaType,
        reason: null,
        created_at: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous ?? null);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved);
      invalidateList();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const undismissMutation = useMutation({
    mutationFn: () => undismiss({ tmdbId, mediaType }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotInterestedItem | null>(key);
      queryClient.setQueryData(key, null);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous ?? null);
    },
    onSuccess: () => {
      invalidateList();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const dismissAction = useCallback(async () => {
    setMutationError(null);
    try {
      await dismissMutation.mutateAsync();
    } catch (err) {
      setMutationError(errorMessage(err, "Failed to dismiss"));
      throw err;
    }
  }, [dismissMutation]);

  const undismissAction = useCallback(async () => {
    setMutationError(null);
    try {
      await undismissMutation.mutateAsync();
    } catch (err) {
      setMutationError(errorMessage(err, "Failed to undo dismiss"));
      throw err;
    }
  }, [undismissMutation]);

  const toggle = useCallback(async () => {
    if (query.data) await undismissAction();
    else await dismissAction();
  }, [dismissAction, query.data, undismissAction]);

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  return {
    item: query.data ?? null,
    isDismissed: !!query.data,
    isLoading: query.isLoading,
    isSaving: dismissMutation.isPending || undismissMutation.isPending,
    error:
      mutationError ??
      (query.error ? errorMessage(query.error, "Failed to load dismiss state") : null),
    dismiss: dismissAction,
    undismiss: undismissAction,
    toggle,
    refetch,
  };
}
