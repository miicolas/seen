import { socialKeys } from "@seen/shared";

import { useOffsetPagination } from "@/hooks/use-offset-pagination";
import { getFollowingActivity, type SocialActivityItem } from "@/services/social";

const PAGE_SIZE = 12;

// Recent activity from everyone the current user follows. A lightweight social
// feed — not the full Home feed deferred to #14/#15.
export function useFollowingActivity() {
  return useOffsetPagination<SocialActivityItem>({
    queryKey: [...socialKeys.activity(), PAGE_SIZE] as const,
    pageSize: PAGE_SIZE,
    fetchPage: (offset, limit) => getFollowingActivity({ limit, offset }),
    errorFallback: "Couldn't load activity.",
  });
}
