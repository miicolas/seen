import { socialKeys } from "@seen/shared";

import { useOffsetPagination } from "@/hooks/use-offset-pagination";
import { getFollowers, getFollowing, type SocialProfileCard } from "@/services/social";

const PAGE_SIZE = 20;

export type FollowListKind = "followers" | "following";

// Paginated followers / following list for a profile. `pageSize` defaults to a
// full list page; the profile strips pass a smaller preview size so they don't
// over-fetch.
export function useFollowList(
  profileId: string | undefined,
  kind: FollowListKind,
  pageSize = PAGE_SIZE,
) {
  const id = profileId ?? "";
  const fetcher = kind === "followers" ? getFollowers : getFollowing;
  const keyFactory = kind === "followers" ? socialKeys.followers : socialKeys.following;

  return useOffsetPagination<SocialProfileCard>({
    queryKey: [...keyFactory(id), pageSize] as const,
    pageSize,
    enabled: id.length > 0,
    fetchPage: (offset, limit) => fetcher(id, { limit, offset }),
    errorFallback: "Couldn't load this list.",
  });
}
