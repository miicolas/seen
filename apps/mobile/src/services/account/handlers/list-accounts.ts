import { eden, unwrapEden } from "@/lib/eden";

import type { LinkedAccount } from "../types";

export function listMyLinkedAccounts(): Promise<LinkedAccount[]> {
  return unwrapEden<LinkedAccount[]>(eden.account.accounts.get());
}
