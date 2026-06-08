import { isKnownGenreId, isKnownMood } from "@seen/shared";
import type { userPreferences } from "@seen/db/schema";

import { HttpError } from "../../lib/http-error";

export type PreferencesInput = {
  favorite_genres: number[];
  disliked_genres: number[];
  moods: string[];
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sharedValues<T>(left: T[], right: T[]): T[] {
  const rightValues = new Set(right);
  return left.filter((value) => rightValues.has(value));
}

function assertKnownGenreIds(ids: number[]) {
  for (const id of ids) {
    if (!isKnownGenreId(id)) throw new HttpError(400, `Unknown genre id: ${id}`);
  }
}

function assertKnownMoods(moods: string[]) {
  for (const mood of moods) {
    if (!isKnownMood(mood)) throw new HttpError(400, `Unknown mood: ${mood}`);
  }
}

export function toPreferences(row: typeof userPreferences.$inferSelect | undefined) {
  if (!row) {
    return { favorite_genres: [], disliked_genres: [], moods: [], updated_at: null };
  }
  return {
    favorite_genres: row.favoriteGenres,
    disliked_genres: row.dislikedGenres,
    moods: row.moods,
    updated_at: row.updatedAt.toISOString(),
  };
}

// Dedupes, then enforces: known genre ids, known moods, and that no genre is
// both a favorite and a dislike. Returns the cleaned input.
export function validatePreferences(input: PreferencesInput): PreferencesInput {
  const favorite_genres = unique(input.favorite_genres);
  const disliked_genres = unique(input.disliked_genres);
  const moods = unique(input.moods);

  assertKnownGenreIds([...favorite_genres, ...disliked_genres]);
  assertKnownMoods(moods);

  const overlap = sharedValues(favorite_genres, disliked_genres);
  if (overlap.length > 0) {
    throw new HttpError(400, `Genres cannot be both favorite and disliked: ${overlap.join(", ")}`);
  }

  return { favorite_genres, disliked_genres, moods };
}
