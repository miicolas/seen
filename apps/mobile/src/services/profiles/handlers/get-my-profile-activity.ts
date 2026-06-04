import { eden, unwrapEden } from "@/lib/eden";

import type { ProfileActivityItem } from "../types";

export function getMyProfileActivity(
  limit = 12,
): Promise<ProfileActivityItem[]> {
  return unwrapEden<ProfileActivityItem[]>(
    eden.profiles.me.activity.get({
      query: { limit },
    }),
  );
}
