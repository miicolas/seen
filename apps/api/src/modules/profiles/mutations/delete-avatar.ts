import { deleteAvatarObject } from "../../../lib/s3";

export async function deleteAvatar(userId: string, path: string) {
  await deleteAvatarObject(userId, path);
  return { ok: true };
}
