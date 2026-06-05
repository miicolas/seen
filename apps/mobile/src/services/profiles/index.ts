export { ProfileError } from "./types";
export type { AvatarUploadInput, Profile, ProfileActivityItem, ProfileInput } from "./types";

export { isValidUsername, normalizeUsername } from "./username";
export { profileAvatarUrl } from "./avatar-url";
export { getOrCreateMyProfile } from "./handlers/get-or-create-my-profile";
export { updateMyProfile } from "./handlers/update-my-profile";
export { deleteProfileAvatarPath, uploadProfileAvatar } from "./handlers/upload-avatar";
export { getMyProfileActivity } from "./handlers/get-my-profile-activity";
// Account deletion lives in the account service (server-side auth.api.deleteUser);
// re-exported here so existing `@/services/profiles` imports keep working.
export { deleteAccount } from "@/services/account";
