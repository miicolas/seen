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
