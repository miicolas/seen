import { enqueueEvent } from "../queue";
import type { EventInput, InteractionEventType } from "../types";

type TrackOptions = Omit<EventInput, "type">;

export function track(type: InteractionEventType, options: TrackOptions = {}): void {
  enqueueEvent({
    type,
    tmdb_id: options.tmdbId,
    media_type: options.mediaType,
    metadata: options.metadata,
  });
}
