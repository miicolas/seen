import { db } from "@seen/db";
import { userPreferences } from "@seen/db/schema";

import { type PreferencesInput, toPreferences, validatePreferences } from "../shared";

export async function setMyPreferences(userId: string, input: PreferencesInput) {
  const clean = validatePreferences(input);

  const [row] = await db
    .insert(userPreferences)
    .values({
      userId,
      favoriteGenres: clean.favorite_genres,
      dislikedGenres: clean.disliked_genres,
      moods: clean.moods,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        favoriteGenres: clean.favorite_genres,
        dislikedGenres: clean.disliked_genres,
        moods: clean.moods,
        updatedAt: new Date(),
      },
    })
    .returning();

  return toPreferences(row);
}
