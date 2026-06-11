import { db } from "@seen/db";
import { watchSessionInvitations, watchSessions } from "@seen/db/schema";
import { and, desc, eq } from "@seen/db/orm";

import {
  expireStalePendingInvitations,
  loadProfileCards,
  serializeInvitation,
  type InvitationDto,
} from "../shared";

export async function listIncomingInvitations(userId: string): Promise<InvitationDto[]> {
  await expireStalePendingInvitations(eq(watchSessionInvitations.inviteeId, userId));

  const rows = await db
    .select({ invitation: watchSessionInvitations, session: watchSessions })
    .from(watchSessionInvitations)
    .innerJoin(watchSessions, eq(watchSessions.id, watchSessionInvitations.sessionId))
    .where(
      and(
        eq(watchSessionInvitations.inviteeId, userId),
        eq(watchSessionInvitations.status, "pending"),
        eq(watchSessions.status, "active"),
      ),
    )
    .orderBy(desc(watchSessionInvitations.createdAt));

  const profiles = await loadProfileCards(rows.map((row) => row.invitation.inviterId));
  return rows.map((row) =>
    serializeInvitation(row.invitation, row.session, profiles.get(row.invitation.inviterId)),
  );
}
