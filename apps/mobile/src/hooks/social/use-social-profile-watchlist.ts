import { socialKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getSocialProfileWatchlist } from "@/services/social";

const PREVIEW_SIZE = 20;

// First page of a profile's visible watchlist — enough for the poster strip on
// the profile screen. Respects server-side visibility filtering.
export function useSocialProfileWatchlist(
  profileId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const id = profileId ?? "";
  const query = useQuery({
    queryKey: socialKeys.profileWatchlist(id),
    queryFn: () => getSocialProfileWatchlist(id, { limit: PREVIEW_SIZE, offset: 0 }),
    enabled: (options.enabled ?? true) && id.length > 0,
  });

  return {
    items: query.data?.items ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load watchlist.") : null,
  };
}
