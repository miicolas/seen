import { auth } from "../../../auth";
import { mapUser } from "../shared";

export async function updateMyUser(
  headers: Headers,
  body: { name?: string; image?: string | null },
) {
  await auth.api.updateUser({ body, headers });
  const data = await auth.api.getSession({ headers });
  return mapUser(data!.user);
}
