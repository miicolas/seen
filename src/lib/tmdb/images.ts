type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";
type BackdropSize = "w300" | "w780" | "w1280" | "original";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbImageUrl(
  path: string | null | undefined,
  size: PosterSize | BackdropSize = "w500",
): string | undefined {
  if (!path) return undefined;
  return `${IMAGE_BASE}/${size}${path}`;
}
