import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the function environment.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
