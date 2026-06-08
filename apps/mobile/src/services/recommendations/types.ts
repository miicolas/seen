import type { MediaFilter } from "@/lib/tmdb";

export type { AvailableEntryDto as AvailableEntry } from "@seen/api/recommendations";

export type AvailableFeedQuery = {
  region: string;
  filter?: MediaFilter;
};
