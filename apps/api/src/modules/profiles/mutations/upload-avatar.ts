import { uploadAvatarObject } from "../../../lib/s3";

export async function uploadAvatar(userId: string, file: File) {
  const path = await uploadAvatarObject(userId, file);
  return { path };
}
