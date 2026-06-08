import { likeKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuthContext } from "@/hooks/use-auth-context";
import { errorMessage } from "@/lib/format";
import { getMyLikesPage, type LikeItemWithMedia } from "@/services/likes";

interface FavoritesState {
  items: LikeItemWithMedia[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFavorites(): FavoritesState {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: likeKeys.list("favorite"),
    queryFn: () => getMyLikesPage({ kind: "favorite", limit: 20 }),
    enabled: !!user,
  });
  const refetchQuery = query.refetch;

  const refetch = useCallback(() => {
    refetchQuery();
  }, [refetchQuery]);

  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Failed to load favorites") : null,
    refetch,
  };
}
