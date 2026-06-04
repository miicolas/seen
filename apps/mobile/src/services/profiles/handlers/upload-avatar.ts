import { apiBaseUrl, authClient } from "@/lib/auth-client";
import { eden, unwrapEden } from "@/lib/eden";

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
  const contentType = input.mimeType ?? "image/jpeg";
  const fileName = input.fileName ?? `avatar.${extensionForUpload(input)}`;
  const form = new FormData();
  const cookie = authClient.getCookie();

  form.append("file", {
    uri: input.uri,
    name: fileName,
    type: contentType,
  } as unknown as Blob);

  const response = await fetch(`${apiBaseUrl}/profiles/me/avatar`, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : undefined,
    credentials: "omit",
    body: form,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Avatar upload failed.");
  }

  if (!payload?.path || typeof payload.path !== "string") {
    throw new Error("Avatar upload returned no path.");
  }

  return payload.path;
}

export async function deleteProfileAvatarPath(path: string | null | undefined) {
  if (!path) return;
  await unwrapEden<{ ok: boolean }>(
    eden.profiles.me.avatar.delete(undefined, {
      query: { path },
    }),
  );
}
