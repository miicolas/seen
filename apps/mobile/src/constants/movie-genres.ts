import { MOVIE_GENRES } from "@seen/shared";

// MOVIE_GENRES is owned by @seen/shared (single source of truth for the genre
// vocabulary, shared with the API). Re-exported here so existing imports from
// "@/constants/movie-genres" keep working.
export { MOVIE_GENRES };

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

export const GENRE_SHELVES: GenreShelf[] = [
  { id: 28, name: MOVIE_GENRES[28] },
  { id: 35, name: MOVIE_GENRES[35] },
  { id: 878, name: MOVIE_GENRES[878] },
];

export interface MediaGenreShelf {
  // i18n key suffix under `discover.genre*` and the English fallback label.
  key: "Action" | "Comedy" | "SciFiFantasy";
  name: string;
  movieGenreId: number;
  tvGenreId: number;
}

export const MEDIA_GENRE_SHELVES: MediaGenreShelf[] = [
  { key: "Action", name: "Action", movieGenreId: 28, tvGenreId: 10759 },
  { key: "Comedy", name: "Comedy", movieGenreId: 35, tvGenreId: 35 },
  { key: "SciFiFantasy", name: "Sci-Fi & Fantasy", movieGenreId: 878, tvGenreId: 10765 },
];
