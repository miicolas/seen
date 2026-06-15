import { mediaRecommendationKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import {
  listReceivedRecommendations,
  markRecommendationRead,
} from "@/services/media-recommendations";

export function useReceivedRecommendations() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const inbox = useQuery({
    queryKey: mediaRecommendationKeys.received(),
    queryFn: listReceivedRecommendations,
    enabled: !!user,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (recommendationId: string) => markRecommendationRead(recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaRecommendationKeys.received() });
      queryClient.invalidateQueries({ queryKey: mediaRecommendationKeys.unreadCount() });
    },
  });

  return { inbox, markRead };
}
