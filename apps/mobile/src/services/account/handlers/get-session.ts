import { eden, unwrapEden } from "@/lib/eden";

import type { AccountSessionInfo } from "../types";

// Server-side session restore (GET /account/session).
export function getMySession(): Promise<AccountSessionInfo> {
  return unwrapEden<AccountSessionInfo>(eden.account.session.get());
}
