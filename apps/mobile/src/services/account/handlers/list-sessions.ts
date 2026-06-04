import { eden, unwrapEden } from "@/lib/eden";

import type { AccountSession } from "../types";

export function listMySessions(): Promise<AccountSession[]> {
  return unwrapEden<AccountSession[]>(eden.account.sessions.get());
}
