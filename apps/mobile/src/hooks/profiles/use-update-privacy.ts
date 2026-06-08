import { profileKeys } from "@seen/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { hapticError } from "@/lib/haptics";
import { updateMyPrivacy, type PrivacyInput, type Profile } from "@/services/profiles";

// Patches the current user's privacy settings and writes the returned profile
// straight back into the `profile.me` cache so toggles reflect instantly.
export function useUpdatePrivacy() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: PrivacyInput) => updateMyPrivacy(input),
    onSuccess: (profile: Profile) => {
      queryClient.setQueryData(profileKeys.me(), profile);
    },
    onError: () => hapticError(),
  });

  return {
    update: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
