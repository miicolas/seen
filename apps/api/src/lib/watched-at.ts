// A review's `watched_at` is the day the user actually saw the title — the basis
// for every "this week / this month" analytics window. Clients send an ISO
// string; we parse it defensively and never trust a future date (a watch can't
// happen tomorrow), clamping anything ahead of `now` back to now.
export function parseWatchedAt(value: string | null | undefined): Date | null {
  if (value == null) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  return parsed.getTime() > now.getTime() ? now : parsed;
}
