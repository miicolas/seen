export function metaLine(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join("  ·  ");
}
