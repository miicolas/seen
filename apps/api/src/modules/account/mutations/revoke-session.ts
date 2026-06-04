import { auth } from "../../../auth";

export async function revokeSession(headers: Headers, body: { token: string }) {
  await auth.api.revokeSession({ body, headers });
  return { ok: true };
}
