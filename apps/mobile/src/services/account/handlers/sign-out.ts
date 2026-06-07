import { authClient, clearAuthData } from "@/lib/auth-client";
import { queryClient } from "@/lib/query-client";

// Ends the Better Auth session, clears persisted auth + cached queries, and lets
// the auth listener flip the guard back to the login screen. Throws on failure so
// callers own their own haptics/UX.
export async function signOut(): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
  await clearAuthData();
  queryClient.clear();
}
