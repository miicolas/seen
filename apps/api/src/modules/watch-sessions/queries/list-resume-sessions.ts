import { deriveCurrentPosition, isResumeEligible } from "../session-state";
import { listOpenParticipations, serializeSession, toProgress, type SessionDto } from "../shared";

const RESUME_LIMIT = 20;

export async function listResumeSessions(userId: string): Promise<SessionDto[]> {
  const open = await listOpenParticipations(userId);
  const now = new Date();
  return open
    .filter((row) =>
      isResumeEligible(deriveCurrentPosition(toProgress(row.me), now), row.me.durationSeconds),
    )
    .slice(0, RESUME_LIMIT)
    .map((row) => serializeSession(row.session, row.me, now));
}
