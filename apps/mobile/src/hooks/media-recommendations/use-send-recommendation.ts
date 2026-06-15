import { mediaRecommendationKeys } from "@seen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ensurePushRegistration } from "@/lib/push-notifications";
import { listRecommendableFriends, sendRecommendation } from "@/services/media-recommendations";

export function useSendRecommendation() {
  const queryClient = useQueryClient();

  const friends = useQuery({
    queryKey: mediaRecommendationKeys.recommendableFriends(),
    queryFn: listRecommendableFriends,
  });

  const send = useMutation({
    mutationFn: sendRecommendation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaRecommendationKeys.all() });
      void ensurePushRegistration();
    },
  });

  return { friends, send };
}
