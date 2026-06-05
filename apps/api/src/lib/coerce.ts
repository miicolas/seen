// Coerce raw external (TMDB) values to their canonical JS type. TMDB JSON is
// trusted, but our `movies.detail` JSONB cache can hand back drifted types, so
// the resource transformers run every value through these before it reaches the
// response schema.

export function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

// TMDB date fields are "YYYY-MM-DD" strings. Accept that, a Date, or a bare
// 4-digit year number; anything else maps to undefined rather than a wrong date.
export function asDateString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 1000 && value <= 9999) {
    return String(value);
  }
  return undefined;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function asNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(asNumber).filter((entry): entry is number => entry != null);
}
