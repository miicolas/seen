const NO_PRIORITY = 9999;

// Order providers by TMDB display priority, pushing entries without one last.
export function byDisplayPriority(
  a: { displayPriority?: number | null },
  b: { displayPriority?: number | null },
): number {
  return (a.displayPriority ?? NO_PRIORITY) - (b.displayPriority ?? NO_PRIORITY);
}
