import { EdenApiError, eden, unwrapEden } from "@/lib/eden";

import type { Profile, ProfileInput } from "../types";
import { ProfileError } from "../types";
import { isValidUsername, normalizeUsername } from "../username";

function assertProfileInput(input: ProfileInput) {
  const fullName = input.fullName.trim();
  const username = normalizeUsername(input.username);

  if (!fullName) {
    throw new ProfileError("full-name-required", "Name is required.");
  }

  if (!isValidUsername(username)) {
    throw new ProfileError(
      "username-invalid",
      "Username must be 3-20 lowercase letters, numbers, dots or underscores.",
    );
  }

  return { fullName, username };
}

export async function updateMyProfile(input: ProfileInput): Promise<Profile> {
  const { fullName, username } = assertProfileInput(input);

  try {
    return await unwrapEden<Profile>(
      eden.profiles.me.patch({
        fullName,
        username,
        ...("avatarPath" in input ? { avatarPath: input.avatarPath ?? null } : {}),
      }),
    );
  } catch (error) {
    if (error instanceof EdenApiError && error.code === "username-taken") {
      throw new ProfileError("username-taken", "That username is already taken.");
    }
    throw error;
  }
}
