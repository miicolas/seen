// Small formatting helpers shared across the UI.

/**
 * Truncate a string to `max` characters, appending an ellipsis when cut.
 * Needed because `@/components/ui/text` (SwiftUI-hosted) has no width-based
 * `numberOfLines` truncation — callers cap by character count instead.
 */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}
