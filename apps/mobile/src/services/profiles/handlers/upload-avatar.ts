import { File, UploadType } from "expo-file-system";

import { apiBaseUrl, getAuthHeaders } from "@/lib/auth-client";
import { eden, unwrapEden } from "@/lib/eden";

import { ProfileError, type AvatarUploadInput } from "../types";

const AVATAR_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const mimeTypeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

function extensionFromFileName(fileName: string | null | undefined) {
  const fileExtension = fileName?.split(".").pop()?.toLowerCase();
  return fileExtension && /^[a-z0-9]+$/.test(fileExtension) ? fileExtension : null;
}

function normalizeUploadMimeType(input: AvatarUploadInput) {
  const mimeType = input.mimeType?.trim().toLowerCase();

  switch (mimeType) {
    case "image/jpeg":
    case "image/png":
    case "image/webp":
    case "image/heic":
    case "image/heif":
      return mimeType;
    case "image/jpg":
    case "image/pjpeg":
      return "image/jpeg";
  }

  const inferredType = mimeTypeByExtension[extensionFromFileName(input.fileName) ?? ""];
  if (inferredType) return inferredType;
  if (!mimeType) return "image/jpeg";

  throw new ProfileError("avatar-invalid-type", "Unsupported profile photo type.");
}

type AvatarUploadPayload = { path?: unknown; code?: unknown; error?: unknown };

function parseUploadBody(body: string): AvatarUploadPayload | null {
  try {
    return JSON.parse(body) as AvatarUploadPayload;
  } catch {
    return null;
  }
}

function avatarUploadError(status: number, payload: AvatarUploadPayload | null) {
  const error = typeof payload?.error === "string" ? payload.error : "";
  const code = typeof payload?.code === "string" ? payload.code : "";

  if (status === 413 || /size|max|large|10m/i.test(error)) {
    return new ProfileError("avatar-too-large", "Profile photo is too large.");
  }

  if (status === 415 || code === "invalid-mime") {
    return new ProfileError("avatar-invalid-type", "Unsupported profile photo type.");
  }

  return new Error(error || "Avatar upload failed.");
}

export async function uploadProfileAvatar(input: AvatarUploadInput): Promise<string> {
  if (input.fileSize && input.fileSize > AVATAR_UPLOAD_MAX_BYTES) {
    throw new ProfileError("avatar-too-large", "Profile photo is too large.");
  }

  const contentType = normalizeUploadMimeType(input);

  // Expo SDK 56's global `fetch` is the WinterCG implementation, whose FormData
  // rejects React Native's `{ uri }` parts ("Unsupported FormDataPart
  // implementation"). Stream the picked file from disk as a native multipart
  // upload instead.
  const result = await new File(input.uri).upload(`${apiBaseUrl}/profiles/me/avatar`, {
    httpMethod: "POST",
    uploadType: UploadType.MULTIPART,
    fieldName: "file",
    mimeType: contentType,
    headers: await getAuthHeaders(),
  });

  const payload = parseUploadBody(result.body);
  if (result.status < 200 || result.status >= 300) {
    throw avatarUploadError(result.status, payload);
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
