import { auth } from "../../../auth";

export async function changeMyPassword(
  headers: Headers,
  body: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  },
) {
  await auth.api.changePassword({ body, headers });
  return { ok: true };
}
