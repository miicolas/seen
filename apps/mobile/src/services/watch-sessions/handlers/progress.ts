import { eden, unwrapEden } from "@/lib/eden";

import type { WatchSession } from "../types";

export async function pauseWatchSession(sessionId: string): Promise<WatchSession> {
  return unwrapEden<WatchSession>(eden["watch-sessions"][sessionId].pause.post({}));
}

export async function resumeWatchSession(sessionId: string): Promise<WatchSession> {
  return unwrapEden<WatchSession>(eden["watch-sessions"][sessionId].resume.post({}));
}

export async function seekWatchSession(
  sessionId: string,
  positionSeconds: number,
): Promise<WatchSession> {
  return unwrapEden<WatchSession>(
    eden["watch-sessions"][sessionId].seek.post({ position_seconds: positionSeconds }),
  );
}

export async function finishWatchSession(sessionId: string): Promise<WatchSession> {
  return unwrapEden<WatchSession>(eden["watch-sessions"][sessionId].finish.post({}));
}
