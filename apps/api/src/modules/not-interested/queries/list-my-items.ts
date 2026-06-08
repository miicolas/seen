import { db } from "@seen/db";
import { notInterested } from "@seen/db/schema";
import { desc, eq } from "drizzle-orm";

import { toNotInterestedItem } from "../shared";

export async function listMyItems(userId: string) {
  const rows = await db
    .select()
    .from(notInterested)
    .where(eq(notInterested.userId, userId))
    .orderBy(desc(notInterested.createdAt));

  return rows.map(toNotInterestedItem);
}
