import { socialKeys } from "@seen/shared";

import { useOffsetPagination } from "@/hooks/use-offset-pagination";
import { getFollowers, getFollowing, type SocialProfileCard } from "@/services/social";

const PAGE_SIZE = 20;

export type FollowListKind = "followers" | "following";

// Paginated followers / following list for a profile.
export function useFollowList(profileId: string | undefined, kind: FollowListKind) {
  const id = profileId ?? "";
  const fetcher = kind === "followers" ? getFollowers : getFollowing;
  const keyFactory = kind === "followers" ? socialKeys.followers : socialKeys.following;

  return useOffsetPagination<SocialProfileCard>({
    queryKey: [...keyFactory(id), PAGE_SIZE] as const,
    pageSize: PAGE_SIZE,
    enabled: id.length > 0,
    fetchPage: (offset, limit) => fetcher(id, { limit, offset }),
    errorFallback: "Couldn't load this list.",
  });
}
