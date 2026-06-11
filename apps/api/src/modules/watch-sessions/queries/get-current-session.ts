import { db } from "@seen/db";
import { profiles, watchSessionParticipants } from "@seen/db/schema";
import { and, eq, ne } from "@seen/db/orm";

import { isResumeEligible } from "../session-state";
import { listOpenParticipations, serializeSession, type SessionDto } from "../shared";

export async function getCurrentSession(userId: string): Promise<SessionDto | null> {
  const open = await listOpenParticipations(userId);
  const now = new Date();
  const picked =
    open.find((row) => row.me.status === "active") ??
    open.find(
      (row) =>
        row.me.status === "paused" &&
        isResumeEligible(row.me.positionSeconds, row.me.durationSeconds),
    );
  if (!picked) return null;

  const [companion] = await db
    .select({ fullName: profiles.fullName })
    .from(watchSessionParticipants)
    .innerJoin(profiles, eq(profiles.id, watchSessionParticipants.userId))
    .where(
      and(
        eq(watchSessionParticipants.sessionId, picked.session.id),
        ne(watchSessionParticipants.userId, userId),
      ),
    )
    .limit(1);

  return serializeSession(picked.session, picked.me, now, companion?.fullName ?? null);
}
