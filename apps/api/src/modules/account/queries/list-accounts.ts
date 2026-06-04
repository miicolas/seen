import { auth } from "../../../auth";
import { mapAccount } from "../shared";

// The providers linked to the current user (apple, credential, …).
export async function listMyAccounts(headers: Headers) {
  const accounts = await auth.api.listUserAccounts({ headers });
  return accounts.map(mapAccount);
}
