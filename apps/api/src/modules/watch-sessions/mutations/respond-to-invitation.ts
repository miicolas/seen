import { db } from "@seen/db";
import { watchSessionInvitations, watchSessionParticipants, watchSessions } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { notifyWatchEvent } from "../notify";
import { deriveCurrentPosition } from "../session-state";
import {
  expireStalePendingInvitations,
  pauseActiveParticipants,
  serializeSession,
  toProgress,
  type SessionDto,
} from "../shared";

async function loadPendingInvitation(userId: string, invitationId: string) {
  const now = new Date();
  await expireStalePendingInvitations(eq(watchSessionInvitations.id, invitationId), now);

  const [row] = await db
    .select({ invitation: watchSessionInvitations, session: watchSessions })
    .from(watchSessionInvitations)
    .innerJoin(watchSessions, eq(watchSessions.id, watchSessionInvitations.sessionId))
    .where(eq(watchSessionInvitations.id, invitationId))
    .limit(1);
  if (!row || row.invitation.inviteeId !== userId) {
    throw new HttpError(404, "Invitation not found.", "NOT_FOUND");
  }
  if (row.invitation.status !== "pending") {
    throw new HttpError(410, "This invitation is no longer open.", "INVITATION_CLOSED");
  }
  if (row.session.status !== "active") {
    throw new HttpError(409, "This session is closed.", "SESSION_CLOSED");
  }
  return { invitation: row.invitation, session: row.session, now };
}

export async function acceptInvitation(
  userId: string,
  invitationId: string,
  fromBeginning = true,
): Promise<SessionDto> {
  const { invitation, session, now } = await loadPendingInvitation(userId, invitationId);

  let startPosition = 0;
  if (!fromBeginning) {
    const [host] = await db
      .select()
      .from(watchSessionParticipants)
      .where(
        and(
          eq(watchSessionParticipants.sessionId, session.id),
          eq(watchSessionParticipants.userId, session.hostId),
        ),
      )
      .limit(1);
    startPosition = host ? deriveCurrentPosition(toProgress(host), now) : 0;
  }

  const me = await db.transaction(async (tx) => {
    await pauseActiveParticipants(tx, userId, now);
    await tx
      .update(watchSessionInvitations)
      .set({ status: "accepted", respondedAt: now })
      .where(eq(watchSessionInvitations.id, invitationId));
    const [participant] = await tx
      .insert(watchSessionParticipants)
      .values({
        sessionId: session.id,
        userId,
        role: "guest",
        status: "active",
        positionSeconds: startPosition,
        durationSeconds: session.durationSeconds,
        startedAt: now,
        lastProgressAt: now,
      })
      .returning();
    return participant!;
  });

  void notifyWatchEvent({
    type: "accepted",
    sessionId: session.id,
    sessionTitle: session.title,
    actorId: userId,
    recipientUserId: invitation.inviterId,
  });
  return serializeSession(session, me, now);
}

export async function declineInvitation(
  userId: string,
  invitationId: string,
): Promise<{ ok: boolean }> {
  const { invitation, session, now } = await loadPendingInvitation(userId, invitationId);
  await db
    .update(watchSessionInvitations)
    .set({ status: "declined", respondedAt: now })
    .where(eq(watchSessionInvitations.id, invitationId));
  void notifyWatchEvent({
    type: "declined",
    sessionId: session.id,
    sessionTitle: session.title,
    actorId: userId,
    recipientUserId: invitation.inviterId,
  });
  return { ok: true };
}
