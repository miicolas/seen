export function metaLine(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join("  ·  ");
}

export function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
