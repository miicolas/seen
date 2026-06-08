import { socialKeys } from "@seen/shared";

import { useOffsetPagination } from "@/hooks/use-offset-pagination";
import { getSocialProfileActivity, type SocialActivityItem } from "@/services/social";

const PAGE_SIZE = 12;

export function useSocialProfileActivity(
  profileId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const id = profileId ?? "";
  return useOffsetPagination<SocialActivityItem>({
    queryKey: [...socialKeys.profileActivity(id), PAGE_SIZE] as const,
    pageSize: PAGE_SIZE,
    enabled: (options.enabled ?? true) && id.length > 0,
    fetchPage: (offset, limit) => getSocialProfileActivity(id, { limit, offset }),
    errorFallback: "Couldn't load activity.",
  });
}
