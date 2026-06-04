import { eden, unwrapEden } from "@/lib/eden";

export function unlinkAccount(input: {
  providerId: string;
  accountId?: string;
}): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(eden.account.accounts.unlink.post(input));
}
