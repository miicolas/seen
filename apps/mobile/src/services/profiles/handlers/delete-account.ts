import { authClient } from "@/lib/auth-client";
import { eden, unwrapEden } from "@/lib/eden";
import { queryClient } from "@/lib/query-client";

export async function deleteAccount(): Promise<void> {
  await unwrapEden<{ ok: boolean }>(eden.profiles.me.delete());
  await authClient.signOut();
  queryClient.clear();
}
