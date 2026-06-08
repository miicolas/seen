import { platformKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getRegion } from "@/lib/region";
import { listProviders, type PlatformProvider } from "@/services/platforms";

export function useProviders(region = getRegion()) {
  const query = useQuery({
    queryKey: platformKeys.providers(region),
    queryFn: () => listProviders(region),
    staleTime: 12 * 60 * 60 * 1000,
  });

  return {
    data: (query.data ?? []) as PlatformProvider[],
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load streaming services.") : null,
    refetch: query.refetch,
  };
}
