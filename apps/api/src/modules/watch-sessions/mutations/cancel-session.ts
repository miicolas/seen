import { db } from "@seen/db";
import { watchSessionInvitations, watchSessionParticipants, watchSessions } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { loadSessionWithParticipant, pauseParticipantsWhere } from "../shared";

export async function cancelSession(userId: string, sessionId: string): Promise<{ ok: boolean }> {
  const { session } = await loadSessionWithParticipant(sessionId, userId);
  if (session.hostId !== userId) {
    throw new HttpError(403, "Only the host can cancel a session.", "HOST_ONLY");
  }
  if (session.status !== "active") return { ok: true };

  const now = new Date();
  await db.transaction(async (tx) => {
    await pauseParticipantsWhere(tx, now, eq(watchSessionParticipants.sessionId, sessionId));
    await tx
      .update(watchSessionInvitations)
      .set({ status: "canceled", respondedAt: now })
      .where(
        and(
          eq(watchSessionInvitations.sessionId, sessionId),
          eq(watchSessionInvitations.status, "pending"),
        ),
      );
    await tx
      .update(watchSessions)
      .set({ status: "canceled" })
      .where(eq(watchSessions.id, sessionId));
  });
  return { ok: true };
}
