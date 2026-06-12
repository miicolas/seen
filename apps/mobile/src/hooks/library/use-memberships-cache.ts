import { libraryKeys } from "@seen/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  addMembership,
  EMPTY_MEMBERSHIPS,
  removeMembership,
  type LibraryMediaRef,
  type LibraryMemberships,
  type MembershipSet,
} from "@/services/library";

export interface MembershipsCache {
  // Cancels in-flight fetches and returns the snapshot to restore on error.
  begin: () => Promise<LibraryMemberships | undefined>;
  add: (set: MembershipSet, ref: LibraryMediaRef) => void;
  remove: (set: MembershipSet, ref: LibraryMediaRef) => void;
  restore: (previous: LibraryMemberships | undefined) => void;
}

// Single write path for the shared memberships cache — every membership
// mutation goes through these optimistic updates instead of refetching.
export function useMembershipsCache(): MembershipsCache {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const key = libraryKeys.memberships();
    const update = (updater: (current: LibraryMemberships) => LibraryMemberships) => {
      queryClient.setQueryData<LibraryMemberships>(key, (current) =>
        updater(current ?? EMPTY_MEMBERSHIPS),
      );
    };

    return {
      async begin() {
        await queryClient.cancelQueries({ queryKey: key });
        return queryClient.getQueryData<LibraryMemberships>(key);
      },
      add: (set, ref) => update((current) => addMembership(current, set, ref)),
      remove: (set, ref) => update((current) => removeMembership(current, set, ref)),
      restore: (previous) => {
        queryClient.setQueryData(key, previous ?? EMPTY_MEMBERSHIPS);
      },
    };
  }, [queryClient]);
}
