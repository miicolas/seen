import { preferenceKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getMyPreferences } from "@/services/preferences";

export function useMyPreferences() {
  const query = useQuery({
    queryKey: preferenceKeys.me(),
    queryFn: () => getMyPreferences(),
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load your taste preferences.") : null,
    refetch: query.refetch,
  };
}
