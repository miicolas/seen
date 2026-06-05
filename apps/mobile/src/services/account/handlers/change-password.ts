import { eden, unwrapEden } from "@/lib/eden";

export function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(eden.account["change-password"].post(input));
}
