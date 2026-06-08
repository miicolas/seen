import { analyticsKeys } from "@seen/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// Returns a callback that drops every cached analytics query, so the Insights
// screen recomputes after an action that changes the underlying data (a review,
// watchlist edit, like, dismissal, import).
export function useInvalidateAnalytics() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all() });
  }, [queryClient]);
}
