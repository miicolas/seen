import { db } from "@seen/db";
import { profiles } from "@seen/db/schema";
import { eq } from "drizzle-orm";

import { HttpError } from "../../../lib/http-error";
import { toApiRow } from "../../../lib/rows";
import { isUniqueViolation } from "../shared";

function assertProfileInput(input: {
  fullName: string;
  username: string;
  avatarPath?: string | null;
}) {
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();

  if (!fullName) {
    throw new HttpError(400, "Name is required.", "full-name-required");
  }

  if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
    throw new HttpError(
      400,
      "Username must be 3-20 lowercase letters, numbers, dots or underscores.",
      "username-invalid",
    );
  }

  return { fullName, username };
}

export async function updateMyProfile(
  userId: string,
  input: {
    fullName: string;
    username: string;
    avatarPath?: string | null;
  },
) {
  const { fullName, username } = assertProfileInput(input);
  const patch: {
    fullName: string;
    username: string;
    avatarPath?: string | null;
  } = { fullName, username };

  if (Object.hasOwn(input, "avatarPath")) {
    patch.avatarPath = input.avatarPath ?? null;
  }

  const result = await db
    .update(profiles)
    .set(patch)
    .where(eq(profiles.id, userId))
    .returning()
    .catch((error) => {
      if (isUniqueViolation(error)) {
        throw new HttpError(
          409,
          "That username is already taken.",
          "username-taken",
        );
      }
      throw error;
    });

  const profile = result[0];
  if (!profile) throw new HttpError(404, "Profile not found");
  return toApiRow(profile);
}
