import { profileKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getMyProfileActivity, type ProfileActivityItem } from "@/services/profiles";

export function useProfileActivity(limit = 12) {
  const query = useQuery({
    queryKey: [...profileKeys.activity(), limit] as const,
    queryFn: () => getMyProfileActivity(limit),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load your activity.") : null,
    refetch: query.refetch,
  } satisfies {
    data: ProfileActivityItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => unknown;
  };
}
