import { platformKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getRegion } from "@/lib/region";
import { getMyPlatforms, type UserPlatforms } from "@/services/platforms";

export function useMyPlatforms(region = getRegion()) {
  const query = useQuery({
    queryKey: platformKeys.me(region),
    queryFn: () => getMyPlatforms(region),
  });

  return {
    data: (query.data ?? null) as UserPlatforms | null,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load your services.") : null,
    refetch: query.refetch,
  };
}
