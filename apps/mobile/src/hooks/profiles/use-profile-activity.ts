import { profileKeys } from "@seen/shared";

import { useOffsetPagination } from "@/hooks/use-offset-pagination";
import { getMyProfileActivity, type ProfileActivityItem } from "@/services/profiles";

const PAGE_SIZE = 12;

export function useProfileActivity() {
  return useOffsetPagination<ProfileActivityItem>({
    queryKey: [...profileKeys.activity(), PAGE_SIZE] as const,
    pageSize: PAGE_SIZE,
    fetchPage: (offset, limit) => getMyProfileActivity({ limit, offset }),
    errorFallback: "Couldn't load your activity.",
  });
}
