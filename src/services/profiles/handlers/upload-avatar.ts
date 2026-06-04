import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

import { AVATARS_BUCKET } from "../avatar-url";
import type { AvatarUploadInput } from "../types";

function extensionForUpload(input: AvatarUploadInput) {
  const fileExtension = input.fileName?.split(".").pop()?.toLowerCase();
  if (fileExtension && /^[a-z0-9]+$/.test(fileExtension)) {
    if (fileExtension === "jpeg") return "jpg";
    return fileExtension;
  }

  switch (input.mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

export async function uploadProfileAvatar(
  input: AvatarUploadInput,
): Promise<string> {
  const userId = await currentUserId();
  // React Native can't stream a Blob from fetch() into supabase-js; upload an
  // ArrayBuffer instead (the supported Expo pattern).
  const arrayBuffer = await fetch(input.uri).then((res) => res.arrayBuffer());
  const contentType = input.mimeType ?? "image/jpeg";
  const path = `${userId}/${Date.now()}.${extensionForUpload(input)}`;

  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}

export async function deleteProfileAvatarPath(path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(AVATARS_BUCKET).remove([path]);
}
