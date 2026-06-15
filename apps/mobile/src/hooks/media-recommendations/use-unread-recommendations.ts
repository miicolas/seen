import { mediaRecommendationKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import { getUnreadRecommendationsCount } from "@/services/media-recommendations";

export function useUnreadRecommendations() {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: mediaRecommendationKeys.unreadCount(),
    queryFn: getUnreadRecommendationsCount,
    enabled: !!user,
    staleTime: 30_000,
  });

  return {
    count: query.data?.count ?? 0,
    refetch: query.refetch,
  };
}
