import { supabase } from "@/lib/supabase";
import { currentUserId } from "@/services/core";

import { isUniqueViolation } from "../errors";
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
  const userId = await currentUserId();
  const { fullName, username } = assertProfileInput(input);

  const patch: Record<string, string | null> = {
    full_name: fullName,
    username,
  };

  if ("avatarPath" in input) {
    patch.avatar_path = input.avatarPath ?? null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw new ProfileError(
        "username-taken",
        "That username is already taken.",
      );
    }
    throw error;
  }

  return data as Profile;
}
