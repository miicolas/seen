import { socialKeys } from "@seen/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// Refresh the social graph after a follow / unfollow / request action. We
// deliberately invalidate the profile, search, activity and request queries but
// NOT contact matches: invalidating that query re-reads and re-hashes the whole
// address book and re-hits the rate-limited /contacts/match endpoint, which an
// unrelated follow tap should never trigger.
export function useInvalidateSocial() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    for (const queryKey of [
      socialKeys.profiles(),
      socialKeys.searches(),
      socialKeys.activity(),
      socialKeys.requests(),
    ]) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient]);
}
