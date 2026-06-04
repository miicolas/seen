import { auth } from "../../../auth";

export async function unlinkAccount(
  headers: Headers,
  body: { providerId: string; accountId?: string },
) {
  await auth.api.unlinkAccount({ body, headers });
  return { ok: true };
}
