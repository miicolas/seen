import { auth } from "../../../auth";
import { HttpError } from "../../../lib/http-error";
import { mapSession, mapUser } from "../shared";

// Server-side session restore: re-reads the current session/user from Better
// Auth using the request headers (cookie or bearer), same as the auth guard.
export async function getMySession(headers: Headers) {
  const data = await auth.api.getSession({ headers });
  if (!data) throw new HttpError(401, "Not signed in.");

  return { user: mapUser(data.user), session: mapSession(data.session) };
}
