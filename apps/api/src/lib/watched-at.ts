// clamp future dates — a watch can't happen tomorrow
export function parseWatchedAt(value: string | null | undefined): Date | null {
  if (value == null) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  return parsed.getTime() > now.getTime() ? now : parsed;
}
