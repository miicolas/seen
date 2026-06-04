import { getAvatarObject } from "../../../lib/s3";

export function getAvatar(userId: string, path: string) {
  return getAvatarObject(userId, path);
}
