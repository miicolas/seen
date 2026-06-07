import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ulid } from "ulid";

import { env } from "../env";
import { HttpError } from "./http-error";

export const s3 = new S3Client({
  region: env.s3Region,
  endpoint: env.s3Endpoint,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
  forcePathStyle: true,
});

function normalizeAvatarMimeType(type: string) {
  switch (type.trim().toLowerCase()) {
    case "image/jpeg":
    case "image/png":
    case "image/webp":
    case "image/heic":
    case "image/heif":
      return type.trim().toLowerCase();
    case "image/jpg":
    case "image/pjpeg":
      return "image/jpeg";
    default:
      throw new HttpError(415, "Unsupported avatar image type.", "invalid-mime");
  }
}

function extensionForMime(type: string) {
  switch (type) {
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

function assertSafeObjectPath(path: string) {
  if (!path || path.includes("..") || path.startsWith("/")) {
    throw new HttpError(400, "Invalid object path.", "invalid-object-path");
  }
}

export function assertUserObjectPath(userId: string, path: string) {
  assertSafeObjectPath(path);

  if (!path.startsWith(`${userId}/`)) {
    throw new HttpError(403, "Object path is not owned by this user.");
  }
}

export async function uploadAvatarObject(userId: string, file: File) {
  const contentType = normalizeAvatarMimeType(file.type);

  const key = `${userId}/${ulid()}.${extensionForMime(contentType)}`;
  const body = new Uint8Array(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: env.s3AvatarsBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=31536000, immutable",
    }),
  );

  return key;
}

export async function deleteAvatarObject(userId: string, path: string) {
  assertUserObjectPath(userId, path);

  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.s3AvatarsBucket,
      Key: path,
    }),
  );
}

export async function getAvatarObject(path: string) {
  assertSafeObjectPath(path);

  const result = await s3
    .send(
      new GetObjectCommand({
        Bucket: env.s3AvatarsBucket,
        Key: path,
      }),
    )
    .catch((error) => {
      if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
        throw new HttpError(404, "Avatar object not found.");
      }
      throw error;
    });

  if (!result.Body) {
    throw new HttpError(404, "Avatar object not found.");
  }

  const body = await result.Body.transformToByteArray();
  const buffer = body.buffer.slice(
    body.byteOffset,
    body.byteOffset + body.byteLength,
  ) as ArrayBuffer;

  return new Response(buffer, {
    headers: {
      "Content-Type": result.ContentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
