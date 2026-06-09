import { tasks } from "@trigger.dev/sdk";

import { env } from "../env";

type TriggerOptions = {
  // Deduplicates runs server-side: repeat triggers with the same key within the
  // TTL attach to the existing run instead of enqueuing a new one.
  idempotencyKey?: string;
  idempotencyKeyTTL?: string;
  delay?: string;
};

// Fire-and-forget trigger of a background task by string id. Decoupled on
// purpose: callers never import task code, only this helper. Returns false
// without enqueuing when Trigger.dev isn't configured so callers can run an
// inline fallback; never throws into the calling handler.
export function maybeTrigger(
  id: string,
  payload: Record<string, unknown>,
  options: TriggerOptions = {},
): boolean {
  if (!env.triggerSecretKey) return false;
  void tasks.trigger(id, payload, options).catch((error) => {
    console.error(`trigger.dev: failed to enqueue "${id}"`, error);
  });
  return true;
}
