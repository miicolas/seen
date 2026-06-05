export function truncate(value: unknown, max: number): string {
  const text = typeof value === "string" ? value : String(value ?? "");
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function releaseYear(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/\d{4}/);
  return match ? match[0] : undefined;
}

export function formatRuntime(minutes?: number | null): string | undefined {
  if (typeof minutes !== "number" || minutes <= 0) return undefined;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDate(
  value?: string | null,
  style: "long" | "short" = "long",
): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(
    "en-US",
    style === "short"
      ? { month: "short", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric" },
  );
}
