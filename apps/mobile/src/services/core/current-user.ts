import { authClient } from "@/lib/auth-client";

export async function currentUserId(): Promise<string> {
  const { data, error } = await authClient.getSession();
  if (error) throw error;
  const id = data?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}
