import { db } from "@seen/db";
import { userPreferences } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { toPreferences } from "../shared";

export async function getMyPreferences(userId: string) {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return toPreferences(row);
}
