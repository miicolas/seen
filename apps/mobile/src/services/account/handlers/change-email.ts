import { eden, unwrapEden } from "@/lib/eden";

// Inert until the server enables `user.changeEmail` + email sending; the UI
// keeps this gated. Wired so the client surface is ready once it exists.
export function changeMyEmail(input: {
  newEmail: string;
  callbackURL?: string;
}): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(eden.account["change-email"].post(input));
}
