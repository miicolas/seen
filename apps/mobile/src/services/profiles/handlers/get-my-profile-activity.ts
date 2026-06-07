import { eden, unwrapEden } from "@/lib/eden";

import type { ProfileActivityItem } from "../types";

export function getMyProfileActivity({
  limit = 12,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<ProfileActivityItem[]> {
  return unwrapEden<ProfileActivityItem[]>(
    eden.profiles.me.activity.get({
      query: { limit, offset },
    }),
  );
}
