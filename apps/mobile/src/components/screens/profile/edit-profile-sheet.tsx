import { useMyProfile } from "@/hooks/profiles/use-my-profile";

import { EditProfileForm } from "./edit-profile-form";
import { LoadingEditProfileSheet } from "./loading-edit-profile-sheet";

export function EditProfileSheet() {
  const profile = useMyProfile();

  if (!profile.data) {
    return <LoadingEditProfileSheet error={profile.error} />;
  }

  return <EditProfileForm key={profile.data.id} initialProfile={profile.data} />;
}
