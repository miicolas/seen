import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";

const AVATARS_BUCKET = "avatars";

function bearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function removeUserAvatars(userId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin.storage
    .from(AVATARS_BUCKET)
    .list(userId, { limit: 1000 });

  if (error) {
    throw error;
  }

  const paths = (data ?? []).map((object) => `${userId}/${object.name}`);
  if (paths.length === 0) {
    return;
  }

  const { error: removeError } = await admin.storage
    .from(AVATARS_BUCKET)
    .remove(paths);

  if (removeError) {
    throw removeError;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const token = bearerToken(req);
  if (!token) {
    return jsonResponse({ error: "Missing authorization token" }, 401);
  }

  const admin = getAdminClient();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: "Invalid authorization token" }, 401);
  }

  try {
    const [, deleteResult] = await Promise.all([
      removeUserAvatars(user.id),
      admin.auth.admin.deleteUser(user.id, false),
    ]);

    if (deleteResult.error) {
      throw deleteResult.error;
    }

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("delete-account failed", error);
    return jsonResponse({ error: "Unable to delete account" }, 500);
  }
});
