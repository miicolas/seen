import { eden, unwrapEden } from "@/lib/eden";

import type { AccountUser } from "../types";

export function updateMyUser(input: {
  name?: string;
  image?: string | null;
}): Promise<AccountUser> {
  return unwrapEden<AccountUser>(eden.account.user.patch(input));
}
