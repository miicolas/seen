import { db } from "@seen/db";
import { watchSessionInvitations, watchSessionParticipants, watchSessions } from "@seen/db/schema";
import { and, eq, gt, sql } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import {
  applyParticipantAction,
  isCollectivelyComplete,
  type ParticipantAction,
  type ParticipantStatus,
} from "../session-state";
import {
  pauseActiveParticipants,
  serializeSession,
  toProgress,
  type DbLike,
  type SessionDto,
} from "../shared";
import { loadSessionWithParticipant } from "../shared";

const ACTION_ERROR_MESSAGES = {
  ALREADY_COMPLETED: "You already finished this session.",
  NOT_PAUSABLE: "Only a playing session can be paused.",
  NOT_RESUMABLE: "This session is already playing.",
} as const;

export async function applySessionAction(
  userId: string,
  sessionId: string,
  action: ParticipantAction,
): Promise<SessionDto> {
  const now = new Date();
  const { session, me } = await loadSessionWithParticipant(sessionId, userId);
  if (session.status === "canceled") {
    throw new HttpError(409, "This session was canceled.", "SESSION_CLOSED");
  }

  const result = applyParticipantAction(toProgress(me), action, now);
  if (!result.ok) {
    throw new HttpError(409, ACTION_ERROR_MESSAGES[result.error], result.error);
  }

  const sessionCompleted = await db.transaction(async (tx) => {
    if (result.patch.status === "active") {
      await pauseActiveParticipants(tx, userId, now, me.id);
    }
    await tx
      .update(watchSessionParticipants)
      .set(result.patch)
      .where(eq(watchSessionParticipants.id, me.id));
    if (action.type === "finish") {
      return await maybeCompleteSession(tx, session.id, now);
    }
    return false;
  });

  const updatedSession = sessionCompleted ? { ...session, status: "completed" } : session;
  return serializeSession(updatedSession, { ...me, ...result.patch }, now);
}

async function maybeCompleteSession(tx: DbLike, sessionId: string, now: Date): Promise<boolean> {
  const [statusRows, [pending]] = await Promise.all([
    tx
      .select({ status: watchSessionParticipants.status })
      .from(watchSessionParticipants)
      .where(eq(watchSessionParticipants.sessionId, sessionId)),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(watchSessionInvitations)
      .where(
        and(
          eq(watchSessionInvitations.sessionId, sessionId),
          eq(watchSessionInvitations.status, "pending"),
          gt(watchSessionInvitations.expiresAt, now),
        ),
      ),
  ]);
  const complete = isCollectivelyComplete(
    statusRows.map((row) => row.status as ParticipantStatus),
    pending?.count ?? 0,
  );
  if (complete) {
    await tx
      .update(watchSessions)
      .set({ status: "completed" })
      .where(eq(watchSessions.id, sessionId));
  }
  return complete;
}
