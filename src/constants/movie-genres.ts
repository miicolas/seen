// TMDB genre ids → names. TMDB does not return genre names on summary payloads
// (only `genre_ids`), and there is no client-side names endpoint, so we keep a
// local map. Ids are stable TMDB movie genre ids.

export const MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

// TMDB *TV* genre ids differ from movie ids (e.g. TV has no plain "Action";
// it bundles "Action & Adventure" = 10759, and "Sci-Fi & Fantasy" = 10765).
export const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

export interface GenreShelf {
  id: number;
  name: string;
}

/** The (movie-only) genre rows. Kept for any movie-specific callers. */
export const GENRE_SHELVES: GenreShelf[] = [
  { id: 28, name: MOVIE_GENRES[28] },
  { id: 35, name: MOVIE_GENRES[35] },
  { id: 878, name: MOVIE_GENRES[878] },
];

// A genre row on the Netflix-style Discover screen mixes movies and series, so
// it needs both the movie genre id and the (often different) tv genre id.
export interface MediaGenreShelf {
  name: string;
  movieGenreId: number;
  tvGenreId: number;
}

/** The mixed genre rows shown on the Discover screen, in order. */
export const MEDIA_GENRE_SHELVES: MediaGenreShelf[] = [
  { name: "Action", movieGenreId: 28, tvGenreId: 10759 },
  { name: "Comedy", movieGenreId: 35, tvGenreId: 35 },
  { name: "Sci-Fi & Fantasy", movieGenreId: 878, tvGenreId: 10765 },
];
