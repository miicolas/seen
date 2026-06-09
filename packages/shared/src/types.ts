export type MediaType = "movie" | "tv";

export function isMediaType(value: unknown): value is MediaType {
  return value === "movie" || value === "tv";
}

// For values that should always be a MediaType (e.g. a DB column) but reach us
// typed as string — fail loudly instead of letting a bad value flow through.
export function asMediaType(value: unknown): MediaType {
  if (isMediaType(value)) return value;
  throw new Error(`Invalid media type: ${String(value)}`);
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}
