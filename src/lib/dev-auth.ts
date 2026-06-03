import { supabase } from "@/lib/supabase";

const DEV_AUTH_EMAIL = "nicolas.becharat@gmail.com";
const DEV_AUTH_PASSWORD = "seen-local-dev-password";

function isLocalSupabaseUrl(url: string | undefined) {
  if (!url) {
    return false;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
    url,
  );
}

export function isDevAuthBypassEnabled() {
  return __DEV__ && isLocalSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
}

export async function signInWithDevSeedUser() {
  if (!isDevAuthBypassEnabled()) {
    throw new Error("Dev auth bypass is only available with local Supabase in dev.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: DEV_AUTH_EMAIL,
    password: DEV_AUTH_PASSWORD,
  });

  if (error) {
    throw error;
  }
}
