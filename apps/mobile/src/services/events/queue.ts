import { AppState } from "react-native";

import { eden } from "@/lib/eden";

import type { InteractionEventPayload } from "./types";

const BATCH_SIZE = 20;
const FLUSH_DELAY_MS = 10_000;

let buffer: InteractionEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let appStateSubscribed = false;

function clearTimer() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export async function flushEvents(): Promise<void> {
  clearTimer();
  if (buffer.length === 0) return;

  const events = buffer;
  buffer = [];

  await eden.events.post({ events }).catch(() => {});
}

function ensureAppStateListener() {
  if (appStateSubscribed) return;
  appStateSubscribed = true;
  AppState.addEventListener("change", (state) => {
    if (state === "background" || state === "inactive") {
      void flushEvents();
    }
  });
}

export function enqueueEvent(event: InteractionEventPayload): void {
  ensureAppStateListener();
  buffer.push(event);

  if (buffer.length >= BATCH_SIZE) {
    void flushEvents();
    return;
  }

  if (!flushTimer) {
    flushTimer = setTimeout(() => void flushEvents(), FLUSH_DELAY_MS);
  }
}
