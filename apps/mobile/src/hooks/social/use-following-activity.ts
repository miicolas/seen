import { socialKeys } from "@seen/shared";

import { useOffsetPagination } from "@/hooks/use-offset-pagination";
import { getFollowingActivity, type SocialActivityItem } from "@/services/social";

const DEFAULT_PAGE_SIZE = 12;

type FollowingActivityOptions = {
  pageSize?: number;
};

// Recent activity from everyone the current user follows. A lightweight social
// feed — not the full Home feed deferred to #14/#15.
export function useFollowingActivity(options: FollowingActivityOptions = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  return useOffsetPagination<SocialActivityItem>({
    queryKey: [...socialKeys.activity(), pageSize] as const,
    pageSize,
    fetchPage: (offset, limit) => getFollowingActivity({ limit, offset }),
    errorFallback: "Couldn't load activity.",
  });
}
