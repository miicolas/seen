import { describe, expect, it } from "bun:test";

import {
  applyParticipantAction,
  deriveCurrentPosition,
  invitationExpiresAt,
  invitationTransition,
  isAbandoned,
  isCollectivelyComplete,
  isCompletionEligible,
  isResumeEligible,
  type ParticipantProgress,
} from "./session-state";

const t0 = new Date("2026-06-11T20:00:00Z");

function at(secondsLater: number): Date {
  return new Date(t0.getTime() + secondsLater * 1000);
}

function participant(overrides: Partial<ParticipantProgress> = {}): ParticipantProgress {
  return {
    status: "active",
    positionSeconds: 0,
    durationSeconds: 7200,
    lastProgressAt: t0,
    ...overrides,
  };
}

describe("deriveCurrentPosition", () => {
  it("advances with elapsed time while active", () => {
    expect(deriveCurrentPosition(participant(), at(90))).toBe(90);
    expect(deriveCurrentPosition(participant({ positionSeconds: 600 }), at(30))).toBe(630);
  });

  it("freezes while paused", () => {
    const paused = participant({ status: "paused", positionSeconds: 600 });
    expect(deriveCurrentPosition(paused, at(3600))).toBe(600);
  });

  it("clamps at duration", () => {
    expect(deriveCurrentPosition(participant({ positionSeconds: 7100 }), at(500))).toBe(7200);
  });

  it("never goes backwards on clock skew", () => {
    expect(deriveCurrentPosition(participant({ positionSeconds: 100 }), at(-50))).toBe(100);
  });

});

describe("resume and completion thresholds", () => {
  it("requires min(60s, 5% of duration)", () => {
    expect(isResumeEligible(59, 7200)).toBe(false);
    expect(isResumeEligible(60, 7200)).toBe(true);
    expect(isResumeEligible(30, 600)).toBe(true);
    expect(isResumeEligible(29, 600)).toBe(false);
  });

  it("treats >= 90% as completion-eligible", () => {
    expect(isCompletionEligible(6479, 7200)).toBe(false);
    expect(isCompletionEligible(6480, 7200)).toBe(true);
  });
});

describe("applyParticipantAction", () => {
  it("pause freezes the derived position", () => {
    const result = applyParticipantAction(
      participant({ positionSeconds: 100 }),
      { type: "pause" },
      at(50),
    );
    expect(result).toEqual({
      ok: true,
      patch: {
        status: "paused",
        positionSeconds: 150,
        lastProgressAt: at(50),
        pausedAt: at(50),
        completedAt: null,
      },
    });
  });

  it("rejects pausing a non-active participant", () => {
    const paused = participant({ status: "paused" });
    expect(applyParticipantAction(paused, { type: "pause" }, at(10))).toEqual({
      ok: false,
      error: "NOT_PAUSABLE",
    });
  });

  it("resume re-anchors lastProgressAt without moving the position", () => {
    const paused = participant({ status: "paused", positionSeconds: 600 });
    const result = applyParticipantAction(paused, { type: "resume" }, at(900));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.patch.status).toBe("active");
    expect(result.patch.positionSeconds).toBe(600);
    expect(result.patch.lastProgressAt).toEqual(at(900));
    expect(result.patch.pausedAt).toBeNull();
  });

  it("rejects resuming an already-active participant", () => {
    expect(applyParticipantAction(participant(), { type: "resume" }, at(10))).toEqual({
      ok: false,
      error: "NOT_RESUMABLE",
    });
  });

  it("seek clamps into [0, duration] and keeps playing state", () => {
    const active = participant({ positionSeconds: 100 });
    const result = applyParticipantAction(active, { type: "seek", positionSeconds: 99999 }, at(10));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.patch.positionSeconds).toBe(7200);
    expect(result.patch.status).toBe("active");

    const below = applyParticipantAction(active, { type: "seek", positionSeconds: -30 }, at(10));
    if (!below.ok) throw new Error("expected ok");
    expect(below.patch.positionSeconds).toBe(0);
  });

  it("seek on a paused participant stays paused", () => {
    const paused = participant({ status: "paused", positionSeconds: 600 });
    const result = applyParticipantAction(paused, { type: "seek", positionSeconds: 1200 }, at(10));
    if (!result.ok) throw new Error("expected ok");
    expect(result.patch.status).toBe("paused");
    expect(result.patch.positionSeconds).toBe(1200);
  });

  it("finish completes only from active or paused, at the derived position", () => {
    const result = applyParticipantAction(
      participant({ positionSeconds: 7000 }),
      { type: "finish" },
      at(50),
    );
    if (!result.ok) throw new Error("expected ok");
    expect(result.patch.status).toBe("completed");
    expect(result.patch.positionSeconds).toBe(7050);
    expect(result.patch.completedAt).toEqual(at(50));
  });

  it("rejects any action on a completed participant", () => {
    const completed = participant({ status: "completed" });
    for (const action of [
      { type: "pause" } as const,
      { type: "resume" } as const,
      { type: "seek", positionSeconds: 0 } as const,
      { type: "finish" } as const,
    ]) {
      expect(applyParticipantAction(completed, action, at(10))).toEqual({
        ok: false,
        error: "ALREADY_COMPLETED",
      });
    }
  });
});

describe("isAbandoned", () => {
  it("flags an active participant 24h past the expected end", () => {
    const active = participant({ positionSeconds: 3600 });
    const expectedEndSeconds = 7200 - 3600;
    expect(isAbandoned(active, at(expectedEndSeconds + 24 * 3600))).toBe(false);
    expect(isAbandoned(active, at(expectedEndSeconds + 24 * 3600 + 1))).toBe(true);
  });

  it("never flags paused or completed participants", () => {
    expect(isAbandoned(participant({ status: "paused" }), at(100 * 24 * 3600))).toBe(false);
    expect(isAbandoned(participant({ status: "completed" }), at(100 * 24 * 3600))).toBe(false);
  });
});

describe("isCollectivelyComplete", () => {
  it("requires every non-abandoned participant to be completed", () => {
    expect(isCollectivelyComplete(["completed", "completed"], 0)).toBe(true);
    expect(isCollectivelyComplete(["completed", "paused"], 0)).toBe(false);
    expect(isCollectivelyComplete(["completed", "abandoned"], 0)).toBe(true);
  });

  it("stays open while invitations are pending", () => {
    expect(isCollectivelyComplete(["completed"], 1)).toBe(false);
  });

  it("is never complete with no countable participants", () => {
    expect(isCollectivelyComplete([], 0)).toBe(false);
    expect(isCollectivelyComplete(["abandoned"], 0)).toBe(false);
  });
});

describe("invitations", () => {
  it("allows the pending transitions and blocks the rest", () => {
    expect(invitationTransition("pending", "accept")).toBe("accepted");
    expect(invitationTransition("pending", "decline")).toBe("declined");
    expect(invitationTransition("pending", "cancel")).toBe("canceled");
    expect(invitationTransition("pending", "expire")).toBe("expired");
    expect(invitationTransition("accepted", "decline")).toBeNull();
    expect(invitationTransition("accepted", "reinvite")).toBeNull();
  });

  it("re-invite reopens declined, canceled, and expired invitations", () => {
    expect(invitationTransition("declined", "reinvite")).toBe("pending");
    expect(invitationTransition("canceled", "reinvite")).toBe("pending");
    expect(invitationTransition("expired", "reinvite")).toBe("pending");
  });

  it("expires 24h after creation", () => {
    expect(invitationExpiresAt(t0).getTime() - t0.getTime()).toBe(24 * 3600_000);
  });
});
