import { supabase } from "@/lib/supabase";

import type { Profile } from "./types";

export const AVATARS_BUCKET = "avatars";

export function profileAvatarUrl(profile: Pick<Profile, "avatar_path"> | null) {
  if (!profile?.avatar_path) return null;
  const { data } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(profile.avatar_path);
  return data.publicUrl;
}
