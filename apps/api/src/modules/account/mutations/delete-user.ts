import { auth } from "../../../auth";

// Credential users pass their password; Apple/OAuth users (no password) rely on
// a fresh session (Better Auth's `freshAge`). The `beforeDelete` hook in auth.ts
// cleans up the S3 avatar; the user-row delete cascades to the rest.
export async function deleteMyUser(
  headers: Headers,
  body: { password?: string },
) {
  await auth.api.deleteUser({ body, headers });
  return { ok: true };
}
