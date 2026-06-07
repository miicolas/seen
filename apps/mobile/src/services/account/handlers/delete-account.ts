import { authClient, clearAuthData } from "@/lib/auth-client";
import { eden, unwrapEden } from "@/lib/eden";
import { queryClient } from "@/lib/query-client";

// Deletes the user via the server (DELETE /account → auth.api.deleteUser).
// Credential users pass a password; Apple/OAuth users rely on a fresh session.
// On success the server session is destroyed; we clear the local cache and let
// the auth listener flip the guard back to the login screen.
export async function deleteAccount(input?: { password?: string }): Promise<void> {
  await unwrapEden<{ ok: boolean }>(
    eden.account.delete(input?.password ? { password: input.password } : {}),
  );
  await authClient.signOut().catch(() => {});
  await clearAuthData();
  queryClient.clear();
}
