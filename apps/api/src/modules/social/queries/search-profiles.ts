import { db } from "@seen/db";
import { profiles } from "@seen/db/schema";
import { and, asc, ilike, ne, or } from "@seen/db/orm";

import { buildProfileCards, normalizePagination } from "../shared";

// Escape LIKE/ILIKE wildcards so a user typing `%` or `_` searches for the literal
// character instead of matching every (or any) profile.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function searchProfiles(viewerId: string, term: string, limit = 20, offset = 0) {
  const { pageSize, offset: from } = normalizePagination(limit, offset);
  const query = term.trim();
  if (!query) return [];

  const pattern = `%${escapeLike(query)}%`;
  const rows = await db
    .select()
    .from(profiles)
    .where(
      and(
        ne(profiles.id, viewerId),
        or(ilike(profiles.username, pattern), ilike(profiles.fullName, pattern)),
      ),
    )
    .orderBy(asc(profiles.username))
    .limit(pageSize)
    .offset(from);

  return buildProfileCards(viewerId, rows);
}
