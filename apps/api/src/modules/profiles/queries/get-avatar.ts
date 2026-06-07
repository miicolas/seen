import { getAvatarObject } from "../../../lib/s3";

export function getAvatar(path: string) {
  return getAvatarObject(path);
}
