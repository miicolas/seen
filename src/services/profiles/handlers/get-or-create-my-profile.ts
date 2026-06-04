import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import { isUniqueViolation } from "../errors";
import type { Profile } from "../types";
import { ProfileError } from "../types";

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function defaultFullName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  return (
    stringValue(metadata?.full_name) ??
    stringValue(metadata?.name) ??
    stringValue(user.email?.split("@")[0]) ??
    "User"
  );
}

function sanitizedUsernameBase(user: User) {
  const emailName = user.email?.split("@")[0] ?? "user";
  const sanitized = emailName
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "");

  return (sanitized.length >= 3 ? sanitized : "user").slice(0, 20);
}

function defaultUsername(user: User, withSuffix = false) {
  const base = sanitizedUsernameBase(user);
  if (!withSuffix) return base;

  const suffix = `_${user.id.replaceAll("-", "").slice(0, 6)}`;
  return `${base.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`;
}

async function currentSessionUser(): Promise<User> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user) {
    throw new ProfileError("not-signed-in", "You must be signed in.");
  }
  return user;
}

export async function getOrCreateMyProfile(): Promise<Profile> {
  const user = await currentSessionUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Profile;

  const input = {
    id: user.id,
    full_name: defaultFullName(user),
    username: defaultUsername(user),
  };
  const insertProfile = (username: string) =>
    supabase
      .from("profiles")
      .insert({ ...input, username })
      .select()
      .single();

  const created = await insertProfile(input.username);
  if (!created.error) return created.data as Profile;
  if (!isUniqueViolation(created.error)) throw created.error;

  const retried = await insertProfile(defaultUsername(user, true));
  if (retried.error) throw retried.error;
  return retried.data as Profile;
}
