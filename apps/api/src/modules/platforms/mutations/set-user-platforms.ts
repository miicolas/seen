import { db } from "@seen/db";
import { providers as providersTable, userPlatforms } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import { getUserPlatforms } from "../queries/get-user-platforms";
import type { SetUserPlatformsInputDto, UserPlatformsDto } from "../model";

export async function setUserPlatforms(
  userId: string,
  input: SetUserPlatformsInputDto,
): Promise<UserPlatformsDto> {
  const uniqueIds = [...new Set(input.providerIds)];

  await db.transaction(async (tx) => {
    await tx
      .delete(userPlatforms)
      .where(and(eq(userPlatforms.userId, userId), eq(userPlatforms.region, input.region)));

    if (uniqueIds.length === 0) return;

    const existing = await tx
      .select({ providerId: providersTable.providerId })
      .from(providersTable)
      .where(inArray(providersTable.providerId, uniqueIds));
    const known = new Set(existing.map((row) => row.providerId));
    const valid = uniqueIds.filter((id) => known.has(id));
    if (valid.length === 0) return;

    await tx
      .insert(userPlatforms)
      .values(
        valid.map((providerId) => ({
          userId,
          providerId,
          region: input.region,
        })),
      )
      .onConflictDoNothing();
  });

  return getUserPlatforms(userId, input.region);
}
