import { useAsyncResource } from "@/hooks/use-async-resource";
import { getOrCreateMyProfile, type Profile } from "@/services/profiles";

export function useMyProfile() {
  return useAsyncResource<Profile | null>(
    getOrCreateMyProfile,
    [],
    null,
    "Couldn't load your profile.",
  );
}
