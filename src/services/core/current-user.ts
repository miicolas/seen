import { supabase } from "@/lib/supabase";

// Reads the id from the locally stored session (no network round-trip). Using
// getUser() here triggers a server fetch + token refresh, which on an expired or
// invalidated session can loop via onAuthStateChange and hang reads. RLS still
// enforces ownership server-side, so the cached id is safe to scope queries.
export async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const id = data.session?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}
