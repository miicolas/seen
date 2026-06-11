import { useEffect, useState } from "react";

import { deriveParticipantPosition, type ProgressFields } from "@/lib/watch-session-position";

export function useTickingPosition(participant: ProgressFields | null | undefined): number {
  const isActive = participant?.status === "active";
  const anchor = participant?.last_progress_at;
  const [nowMs, setNowMs] = useState(() => (anchor ? Date.parse(anchor) : 0));

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive, anchor]);

  if (!participant) return 0;
  return deriveParticipantPosition(participant, nowMs);
}
