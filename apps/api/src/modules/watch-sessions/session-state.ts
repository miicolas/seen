export const RESUME_MIN_SECONDS = 60;
export const RESUME_MIN_FRACTION = 0.05;
export const COMPLETION_FRACTION = 0.9;
export const INVITATION_TTL_HOURS = 24;
export const ABANDON_GRACE_HOURS = 24;

export type ParticipantStatus = "active" | "paused" | "completed" | "abandoned";
export type SessionStatus = "active" | "completed" | "canceled";
export type InvitationStatus = "pending" | "accepted" | "declined" | "canceled" | "expired";

export type ParticipantProgress = {
  status: ParticipantStatus;
  positionSeconds: number;
  durationSeconds: number;
  lastProgressAt: Date;
};

export type ParticipantAction =
  | { type: "pause" }
  | { type: "resume" }
  | { type: "seek"; positionSeconds: number }
  | { type: "finish" };

export type ParticipantPatch = {
  status: ParticipantStatus;
  positionSeconds: number;
  lastProgressAt: Date;
  pausedAt: Date | null;
  completedAt: Date | null;
};

export type ParticipantActionError = "ALREADY_COMPLETED" | "NOT_PAUSABLE" | "NOT_RESUMABLE";

export type ParticipantActionResult =
  | { ok: true; patch: ParticipantPatch }
  | { ok: false; error: ParticipantActionError };

export function deriveCurrentPosition(progress: ParticipantProgress, now: Date): number {
  if (progress.status !== "active") {
    return Math.min(progress.positionSeconds, progress.durationSeconds);
  }
  const elapsed = Math.max(0, (now.getTime() - progress.lastProgressAt.getTime()) / 1000);
  return Math.min(progress.positionSeconds + Math.floor(elapsed), progress.durationSeconds);
}

export function isResumeEligible(positionSeconds: number, durationSeconds: number): boolean {
  return positionSeconds >= Math.min(RESUME_MIN_SECONDS, RESUME_MIN_FRACTION * durationSeconds);
}

export function isCompletionEligible(positionSeconds: number, durationSeconds: number): boolean {
  return positionSeconds >= COMPLETION_FRACTION * durationSeconds;
}

export function isAbandoned(progress: ParticipantProgress, now: Date): boolean {
  if (progress.status !== "active") return false;
  const expectedEnd =
    progress.lastProgressAt.getTime() +
    (progress.durationSeconds - progress.positionSeconds) * 1000;
  return now.getTime() > expectedEnd + ABANDON_GRACE_HOURS * 3600_000;
}

export function isCollectivelyComplete(
  participantStatuses: ParticipantStatus[],
  pendingInvitationCount: number,
): boolean {
  if (pendingInvitationCount > 0) return false;
  const counted = participantStatuses.filter((status) => status !== "abandoned");
  return counted.length > 0 && counted.every((status) => status === "completed");
}

function clampPosition(positionSeconds: number, durationSeconds: number): number {
  return Math.max(0, Math.min(Math.floor(positionSeconds), durationSeconds));
}

export function applyParticipantAction(
  progress: ParticipantProgress,
  action: ParticipantAction,
  now: Date,
): ParticipantActionResult {
  if (progress.status === "completed") {
    return { ok: false, error: "ALREADY_COMPLETED" };
  }
  const derived = deriveCurrentPosition(progress, now);

  switch (action.type) {
    case "pause": {
      if (progress.status !== "active") return { ok: false, error: "NOT_PAUSABLE" };
      return {
        ok: true,
        patch: {
          status: "paused",
          positionSeconds: derived,
          lastProgressAt: now,
          pausedAt: now,
          completedAt: null,
        },
      };
    }
    case "resume": {
      if (progress.status === "active") return { ok: false, error: "NOT_RESUMABLE" };
      return {
        ok: true,
        patch: {
          status: "active",
          positionSeconds: derived,
          lastProgressAt: now,
          pausedAt: null,
          completedAt: null,
        },
      };
    }
    case "seek": {
      return {
        ok: true,
        patch: {
          status: progress.status === "abandoned" ? "paused" : progress.status,
          positionSeconds: clampPosition(action.positionSeconds, progress.durationSeconds),
          lastProgressAt: now,
          pausedAt: progress.status === "active" ? null : now,
          completedAt: null,
        },
      };
    }
    case "finish": {
      return {
        ok: true,
        patch: {
          status: "completed",
          positionSeconds: derived,
          lastProgressAt: now,
          pausedAt: null,
          completedAt: now,
        },
      };
    }
  }
}

export type InvitationAction = "accept" | "decline" | "cancel" | "expire" | "reinvite";

const INVITATION_TRANSITIONS: Record<
  InvitationStatus,
  Partial<Record<InvitationAction, InvitationStatus>>
> = {
  pending: { accept: "accepted", decline: "declined", cancel: "canceled", expire: "expired" },
  accepted: {},
  declined: { reinvite: "pending" },
  canceled: { reinvite: "pending" },
  expired: { reinvite: "pending" },
};

export function invitationTransition(
  from: InvitationStatus,
  action: InvitationAction,
): InvitationStatus | null {
  return INVITATION_TRANSITIONS[from][action] ?? null;
}

export function invitationExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + INVITATION_TTL_HOURS * 3600_000);
}
