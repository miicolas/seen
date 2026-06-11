import { db } from "@seen/db";
import { watchSessionInvitations, watchSessions } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { notifyWatchEvent } from "../notify";

export async function cancelInvitation(
  userId: string,
  invitationId: string,
): Promise<{ ok: boolean }> {
  const [row] = await db
    .select({ invitation: watchSessionInvitations, session: watchSessions })
    .from(watchSessionInvitations)
    .innerJoin(watchSessions, eq(watchSessions.id, watchSessionInvitations.sessionId))
    .where(eq(watchSessionInvitations.id, invitationId))
    .limit(1);
  if (!row || row.invitation.inviterId !== userId) {
    throw new HttpError(404, "Invitation not found.", "NOT_FOUND");
  }
  if (row.invitation.status !== "pending") return { ok: true };

  await db
    .update(watchSessionInvitations)
    .set({ status: "canceled", respondedAt: new Date() })
    .where(eq(watchSessionInvitations.id, invitationId));

  void notifyWatchEvent({
    type: "canceled",
    sessionId: row.session.id,
    sessionTitle: row.session.title,
    actorId: userId,
    recipientUserId: row.invitation.inviteeId,
  });
  return { ok: true };
}
