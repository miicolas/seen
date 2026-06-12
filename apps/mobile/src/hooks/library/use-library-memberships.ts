import { libraryKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import {
  EMPTY_MEMBERSHIPS,
  getLibraryMemberships,
  type LibraryMemberships,
} from "@/services/library";

// Memberships only change through the user's own actions and every mutation
// keeps this cache in sync, so the query can stay fresh for a long time.
const MEMBERSHIPS_STALE_TIME = 1000 * 60 * 30;

interface LibraryMembershipsState {
  memberships: LibraryMemberships;
  isLoading: boolean;
}

export function useLibraryMemberships(): LibraryMembershipsState {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: libraryKeys.memberships(),
    queryFn: getLibraryMemberships,
    enabled: !!user,
    staleTime: MEMBERSHIPS_STALE_TIME,
  });

  return {
    memberships: query.data ?? EMPTY_MEMBERSHIPS,
    isLoading: query.isLoading,
  };
}
