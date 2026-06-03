export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
