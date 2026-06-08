import { socialKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getSocialProfile } from "@/services/social";

export function useSocialProfile(
  profileId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const id = profileId ?? "";
  const query = useQuery({
    queryKey: socialKeys.profile(id),
    queryFn: () => getSocialProfile(id),
    enabled: (options.enabled ?? true) && id.length > 0,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load this profile.") : null,
    refetch: query.refetch,
  };
}
