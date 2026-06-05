import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { changeMyPassword, updateMyUser } from "@/services/account";

// Force the reactive `useSession` store to refresh from the server after a
// profile change so the rest of the app sees the new name/image.
function refreshSession() {
  authClient.getSession({ query: { disableCookieCache: true } }).catch(() => {});
}

export function useAccountMutations() {
  const update = useMutation({
    mutationFn: (input: { name?: string; image?: string | null }) => updateMyUser(input),
    onSuccess: refreshSession,
  });

  const password = useMutation({
    mutationFn: (input: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions?: boolean;
    }) => changeMyPassword(input),
  });

  return {
    updateUser: update.mutateAsync,
    isUpdating: update.isPending,
    changePassword: password.mutateAsync,
    isChangingPassword: password.isPending,
  };
}
