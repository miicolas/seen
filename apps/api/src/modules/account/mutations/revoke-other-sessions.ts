import { auth } from "../../../auth";

export async function revokeOtherSessions(headers: Headers) {
  await auth.api.revokeOtherSessions({ headers });
  return { ok: true };
}
