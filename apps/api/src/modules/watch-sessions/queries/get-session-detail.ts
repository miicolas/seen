import { db } from "@seen/db";
import { watchSessionInvitations, watchSessionParticipants, watchSessions } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import {
  expireStalePendingInvitations,
  lazyAbandon,
  loadProfileCards,
  serializeSessionDetail,
  type SessionDetailDto,
} from "../shared";

export async function getSessionDetail(
  viewerId: string,
  sessionId: string,
): Promise<SessionDetailDto> {
  const [session] = await db
    .select()
    .from(watchSessions)
    .where(eq(watchSessions.id, sessionId))
    .limit(1);
  if (!session) throw new HttpError(404, "Session not found.", "NOT_FOUND");

  const now = new Date();
  await expireStalePendingInvitations(eq(watchSessionInvitations.sessionId, sessionId), now);
  const [participants, invitations] = await Promise.all([
    db
      .select()
      .from(watchSessionParticipants)
      .where(eq(watchSessionParticipants.sessionId, sessionId))
      .orderBy(watchSessionParticipants.createdAt)
      .then((rows) => lazyAbandon(rows, now)),
    db
      .select()
      .from(watchSessionInvitations)
      .where(eq(watchSessionInvitations.sessionId, sessionId)),
  ]);

  const pendingInvitations = invitations.filter((row) => row.status === "pending");

  const isParticipant = participants.some((row) => row.userId === viewerId);
  const isPendingInvitee = pendingInvitations.some((row) => row.inviteeId === viewerId);
  if (!isParticipant && !isPendingInvitee) {
    throw new HttpError(404, "Session not found.", "NOT_FOUND");
  }

  const profileCards = await loadProfileCards([
    ...participants.map((row) => row.userId),
    ...pendingInvitations.map((row) => row.inviteeId),
  ]);
  return serializeSessionDetail(
    session,
    participants,
    pendingInvitations,
    viewerId,
    now,
    profileCards,
  );
}
