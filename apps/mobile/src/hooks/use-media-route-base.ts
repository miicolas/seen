import { useSegments } from "expo-router";

import type { MediaRouteBase } from "@/lib/navigation";

// Resolve which tab Stack currently hosts the media-detail screen so its
// internal navigation (image viewer, episode) and the back/zoom transition
// stay within the originating tab. Defaults to discover.
export function useMediaRouteBase(): MediaRouteBase {
  const segments = useSegments() as string[];
  return segments.includes("watchlist") ? "watchlist" : "discover";
}
