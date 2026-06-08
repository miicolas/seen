export interface Genre {
  id: number;
  name: string;
}

// Canonical genre vocabulary for taste preferences and the genre picker.
// These are TMDB *movie* genre ids — the umbrella set we store in
// `user_preferences`; TV-only ids map onto these where a consumer needs them.
export const MOVIE_GENRES_LIST: Genre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export const MOVIE_GENRE_IDS: number[] = MOVIE_GENRES_LIST.map((genre) => genre.id);

export const MOVIE_GENRES: Record<number, string> = Object.fromEntries(
  MOVIE_GENRES_LIST.map((genre) => [genre.id, genre.name]),
);

export function isKnownGenreId(id: number): boolean {
  return MOVIE_GENRE_IDS.includes(id);
}
