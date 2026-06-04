import { profileKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getOrCreateMyProfile, type Profile } from "@/services/profiles";

export function useMyProfile() {
  const query = useQuery({
    queryKey: profileKeys.me(),
    queryFn: getOrCreateMyProfile,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? errorMessage(query.error, "Couldn't load your profile.")
      : null,
    refetch: query.refetch,
  } satisfies {
    data: Profile | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => unknown;
  };
}
