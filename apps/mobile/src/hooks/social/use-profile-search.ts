import { socialKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { errorMessage } from "@/lib/format";
import { searchProfiles } from "@/services/social";

const DEBOUNCE_MS = 300;

export function useProfileSearch(term: string) {
  const trimmed = term.trim();
  const debounced = useDebouncedValue(trimmed, trimmed ? DEBOUNCE_MS : 0);

  const query = useQuery({
    queryKey: socialKeys.search(debounced),
    queryFn: () => searchProfiles(debounced),
    enabled: debounced.length > 0,
  });

  return {
    data: debounced.length > 0 ? (query.data ?? []) : [],
    isLoading: debounced.length > 0 && query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't search profiles.") : null,
  };
}
