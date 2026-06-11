import { db } from "@seen/db";
import { watchSessionInvitations, watchSessionParticipants } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { maybeTrigger } from "../../../lib/trigger";
import { isMutualFollow } from "../../social/queries";
import { notifyWatchEvent } from "../notify";
import { invitationExpiresAt, invitationTransition, type InvitationStatus } from "../session-state";
import {
  expireStalePendingInvitations,
  loadProfileCards,
  loadSessionWithParticipant,
  serializeInvitation,
  type InvitationDto,
} from "../shared";

export async function inviteToSession(
  userId: string,
  sessionId: string,
  inviteeId: string,
): Promise<InvitationDto> {
  const { session } = await loadSessionWithParticipant(sessionId, userId);
  if (session.hostId !== userId) {
    throw new HttpError(403, "Only the host can invite.", "HOST_ONLY");
  }
  if (session.status !== "active") {
    throw new HttpError(409, "This session is closed.", "SESSION_CLOSED");
  }
  if (inviteeId === userId) {
    throw new HttpError(400, "You can't invite yourself.");
  }
  if (!(await isMutualFollow(userId, inviteeId))) {
    throw new HttpError(
      403,
      "You can only invite people you follow each other with.",
      "NOT_MUTUAL",
    );
  }

  const [participant] = await db
    .select({ id: watchSessionParticipants.id })
    .from(watchSessionParticipants)
    .where(
      and(
        eq(watchSessionParticipants.sessionId, sessionId),
        eq(watchSessionParticipants.userId, inviteeId),
      ),
    )
    .limit(1);
  if (participant) {
    throw new HttpError(409, "They already joined this session.", "ALREADY_PARTICIPANT");
  }

  const now = new Date();
  const expiresAt = invitationExpiresAt(now);
  await expireStalePendingInvitations(
    and(
      eq(watchSessionInvitations.sessionId, sessionId),
      eq(watchSessionInvitations.inviteeId, inviteeId),
    ),
    now,
  );
  const [existing] = await db
    .select()
    .from(watchSessionInvitations)
    .where(
      and(
        eq(watchSessionInvitations.sessionId, sessionId),
        eq(watchSessionInvitations.inviteeId, inviteeId),
      ),
    )
    .limit(1);

  let invitation;
  if (existing) {
    if (invitationTransition(existing.status as InvitationStatus, "reinvite") !== "pending") {
      throw new HttpError(409, "They already have an invitation.", "ALREADY_INVITED");
    }
    [invitation] = await db
      .update(watchSessionInvitations)
      .set({ status: "pending", inviterId: userId, expiresAt, respondedAt: null })
      .where(eq(watchSessionInvitations.id, existing.id))
      .returning();
  } else {
    [invitation] = await db
      .insert(watchSessionInvitations)
      .values({ sessionId, inviterId: userId, inviteeId, expiresAt })
      .returning();
  }

  maybeTrigger(
    "expire-watch-invitation",
    { invitationId: invitation!.id },
    { delay: "24h", idempotencyKey: `${invitation!.id}:${expiresAt.toISOString()}` },
  );

  void notifyWatchEvent({
    type: "invited",
    sessionId,
    sessionTitle: session.title,
    actorId: userId,
    recipientUserId: inviteeId,
  });

  const inviterProfiles = await loadProfileCards([userId]);
  return serializeInvitation(invitation!, session, inviterProfiles.get(userId));
}
