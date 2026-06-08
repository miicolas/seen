import { db } from "@seen/db";
import { providers as providersTable, userPlatforms } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { byDisplayPriority } from "../../../lib/sort";
import type { UserPlatformsDto } from "../model";

export async function getUserPlatforms(userId: string, region: string): Promise<UserPlatformsDto> {
  const rows = await db
    .select({
      providerId: userPlatforms.providerId,
      name: providersTable.name,
      logoPath: providersTable.logoPath,
      displayPriority: providersTable.displayPriority,
    })
    .from(userPlatforms)
    .innerJoin(providersTable, eq(providersTable.providerId, userPlatforms.providerId))
    .where(and(eq(userPlatforms.userId, userId), eq(userPlatforms.region, region)));

  const providers = rows.sort(byDisplayPriority).map((row) => ({
    providerId: row.providerId,
    name: row.name,
    logoPath: row.logoPath ?? null,
  }));

  return { region, providers };
}
