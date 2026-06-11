export type ProgressFields = {
  status: string;
  position_seconds: number;
  duration_seconds: number;
  last_progress_at: string;
};

export function deriveParticipantPosition(participant: ProgressFields, nowMs = Date.now()): number {
  if (participant.status !== "active") {
    return Math.min(participant.position_seconds, participant.duration_seconds);
  }
  const anchorMs = Date.parse(participant.last_progress_at);
  const elapsed = Math.max(0, (nowMs - anchorMs) / 1000);
  return Math.min(participant.position_seconds + Math.floor(elapsed), participant.duration_seconds);
}

export function participantRemainingSeconds(
  participant: ProgressFields,
  nowMs = Date.now(),
): number {
  return Math.max(0, participant.duration_seconds - deriveParticipantPosition(participant, nowMs));
}

export function formatPlayerTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
