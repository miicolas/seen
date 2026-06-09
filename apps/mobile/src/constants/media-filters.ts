import type { SFSymbol } from "sf-symbols-typescript";

import type { MediaFilter } from "@/lib/tmdb";

export type MediaFilterOption = {
  value: MediaFilter;
  labelKey: "filterAll" | "filterMovies" | "filterSeries";
  icon: SFSymbol;
};

export const MEDIA_FILTER_OPTIONS: MediaFilterOption[] = [
  { value: "all", labelKey: "filterAll", icon: "square.grid.2x2" },
  { value: "movie", labelKey: "filterMovies", icon: "film" },
  { value: "tv", labelKey: "filterSeries", icon: "tv" },
];
