import { useMutation } from "@tanstack/react-query";

import { hapticError, hapticSuccess } from "@/lib/haptics";
import { followProfile, unfollowProfile } from "@/services/social";

import { useInvalidateSocial } from "./use-invalidate-social";

// Follow / unfollow a profile. On success we refresh the social graph (profiles,
// counts, requests, lists) — see useInvalidateSocial for why contact matches are
// intentionally left out.
export function useFollowActions(profileId: string) {
  const invalidate = useInvalidateSocial();

  const follow = useMutation({
    mutationFn: () => followProfile(profileId),
    onSuccess: () => {
      hapticSuccess();
      invalidate();
    },
    onError: () => hapticError(),
  });

  const unfollow = useMutation({
    mutationFn: () => unfollowProfile(profileId),
    onSuccess: () => {
      hapticSuccess();
      invalidate();
    },
    onError: () => hapticError(),
  });

  return {
    follow: follow.mutateAsync,
    unfollow: unfollow.mutateAsync,
    isPending: follow.isPending || unfollow.isPending,
  };
}
