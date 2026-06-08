import { enqueueImpression } from "../queue";
import type { ImpressionInput } from "../types";

// Record that a recommended item was shown to the user. Batched + deduped by the
// queue, so callers can fire freely as cards scroll into view.
export function trackImpression(input: ImpressionInput): void {
  enqueueImpression(input);
}
