import { AppState } from "react-native";

import { eden } from "@/lib/eden";

import type { ImpressionInput, ImpressionPayload, InteractionEventPayload } from "./types";

const BATCH_SIZE = 20;
const IMPRESSION_BATCH_SIZE = 30;
const FLUSH_DELAY_MS = 10_000;

let buffer: InteractionEventPayload[] = [];
let impressionBuffer: ImpressionPayload[] = [];
// One impression per shelf-instance/item/source/position for the lifetime of the
// app process, so re-rendering or re-scrolling a shelf never double-counts the same
// card — while the same title in two distinct shelves still counts as two.
const seenImpressions = new Set<string>();
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

  if (buffer.length > 0) {
    const events = buffer;
    buffer = [];
    await eden.events.post({ events }).catch(() => {});
  }

  if (impressionBuffer.length > 0) {
    const impressions = impressionBuffer;
    impressionBuffer = [];
    await eden.events.impressions.post({ impressions }).catch(() => {});
  }
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

function scheduleFlush() {
  if (!flushTimer) {
    flushTimer = setTimeout(() => void flushEvents(), FLUSH_DELAY_MS);
  }
}

export function enqueueEvent(event: InteractionEventPayload): void {
  ensureAppStateListener();
  buffer.push(event);

  if (buffer.length >= BATCH_SIZE) {
    void flushEvents();
    return;
  }
  scheduleFlush();
}

export function enqueueImpression(impression: ImpressionInput): void {
  const dedupeKey = `${impression.scope}:${impression.source}:${impression.mediaType}:${impression.tmdbId}:${impression.position}`;
  if (seenImpressions.has(dedupeKey)) return;
  seenImpressions.add(dedupeKey);

  ensureAppStateListener();
  impressionBuffer.push({
    tmdb_id: impression.tmdbId,
    media_type: impression.mediaType,
    source: impression.source,
    position: impression.position,
  });

  if (impressionBuffer.length >= IMPRESSION_BATCH_SIZE) {
    void flushEvents();
    return;
  }
  scheduleFlush();
}
