import { apiBaseUrl } from "@/lib/auth-client";

import type { Profile } from "./types";

export function profileAvatarUrl(profile: Pick<Profile, "avatar_path"> | null) {
  if (!profile?.avatar_path) return null;
  const path = encodeURIComponent(profile.avatar_path);
  return `${apiBaseUrl}/profiles/avatar?path=${path}`;
}
