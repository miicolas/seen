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

export interface GenreShelf {
  id: number;
  name: string;
}

/** The genre rows shown on the Discover screen, in order. */
export const GENRE_SHELVES: GenreShelf[] = [
  { id: 28, name: MOVIE_GENRES[28] },
  { id: 35, name: MOVIE_GENRES[35] },
  { id: 878, name: MOVIE_GENRES[878] },
];
