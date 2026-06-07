import { whatsNewKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { getWhatsNewReleases } from "@/services/whats-new";

const ONE_HOUR = 1000 * 60 * 60;

export function useWhatsNewReleases() {
  const query = useQuery({
    queryKey: whatsNewKeys.releases(),
    queryFn: getWhatsNewReleases,
    staleTime: ONE_HOUR,
  });

  return {
    releases: query.data ?? [],
    isLoading: query.isLoading,
  };
}
