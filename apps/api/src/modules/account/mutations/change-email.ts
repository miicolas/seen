import { auth } from "../../../auth";

// NOTE: inert until the server enables `user.changeEmail.enabled` AND wires
// `emailVerification.sendVerificationEmail` (no email infra yet). Until then
// Better Auth rejects this call; the route is scaffolded so the client surface
// is ready once email sending exists.
export async function changeMyEmail(
  headers: Headers,
  body: { newEmail: string; callbackURL?: string },
) {
  await auth.api.changeEmail({ body, headers });
  return { ok: true };
}
