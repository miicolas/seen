import type { MediaType } from "../tmdb";

export type SeedEntry = {
  tmdbId: number;
  mediaType: MediaType;
};

// Hand-curated diverse probe set for the adaptive deck: it opens the deck and
// fills the explore slots between recommendation-driven (exploit) cards.
// Ordered round-robin so any prefix (the importer-shortened ~8 or the full ~18)
// already spans many genres and decades. The genre/decade of each title is noted
// in the trailing comment so the diversity intent stays readable.
export const SEED_TITLES: SeedEntry[] = [
  { tmdbId: 278, mediaType: "movie" }, // The Shawshank Redemption — Drama, 1990s
  { tmdbId: 76341, mediaType: "movie" }, // Mad Max: Fury Road — Action, 2010s
  { tmdbId: 129, mediaType: "movie" }, // Spirited Away — Animation, 2000s
  { tmdbId: 238, mediaType: "movie" }, // The Godfather — Crime, 1970s
  { tmdbId: 603, mediaType: "movie" }, // The Matrix — Sci-Fi, 1990s
  { tmdbId: 419430, mediaType: "movie" }, // Get Out — Horror, 2010s
  { tmdbId: 1399, mediaType: "tv" }, // Game of Thrones — Fantasy, 2010s
  { tmdbId: 289, mediaType: "movie" }, // Casablanca — Romance, 1940s
  { tmdbId: 680, mediaType: "movie" }, // Pulp Fiction — Thriller, 1990s
  { tmdbId: 105, mediaType: "movie" }, // Back to the Future — Adventure, 1980s
  { tmdbId: 244786, mediaType: "movie" }, // Whiplash — Music, 2010s
  { tmdbId: 1396, mediaType: "tv" }, // Breaking Bad — Crime, 2000s
  { tmdbId: 62, mediaType: "movie" }, // 2001: A Space Odyssey — Sci-Fi, 1960s
  { tmdbId: 539, mediaType: "movie" }, // Psycho — Horror, 1960s
  { tmdbId: 120467, mediaType: "movie" }, // The Grand Budapest Hotel — Comedy, 2010s
  { tmdbId: 120, mediaType: "movie" }, // LOTR: Fellowship of the Ring — Adventure, 2000s
  { tmdbId: 510, mediaType: "movie" }, // One Flew Over the Cuckoo's Nest — Drama, 1970s
  { tmdbId: 66732, mediaType: "tv" }, // Stranger Things — Sci-Fi, 2010s
];
