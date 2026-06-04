import { auth } from "../../../auth";
import { mapSession } from "../shared";

// The current user's own active sessions (self-service, not the admin endpoint).
export async function listMySessions(headers: Headers) {
  const sessions = await auth.api.listSessions({ headers });
  return sessions.map(mapSession);
}
