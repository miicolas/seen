import type { MediaFilter } from "@/lib/tmdb";

export type {
  AvailableEntryDto as AvailableEntry,
  FeedEntryDto as FeedEntry,
  FeedSectionDto as FeedSection,
  FeedResponseDto as FeedResponse,
} from "@seen/api/recommendations";

export type AvailableFeedQuery = {
  region: string;
  filter?: MediaFilter;
};

export type FeedQuery = {
  region: string;
  // Refresh salt: a new value makes the server resample the feed sections.
  refresh?: string;
};
