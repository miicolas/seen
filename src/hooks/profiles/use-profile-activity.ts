import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  getMyProfileActivity,
  type ProfileActivityItem,
} from "@/services/profiles";

export function useProfileActivity(limit = 12) {
  return useAsyncResource<ProfileActivityItem[]>(
    () => getMyProfileActivity(limit),
    [limit],
    [],
    "Couldn't load your activity.",
  );
}
