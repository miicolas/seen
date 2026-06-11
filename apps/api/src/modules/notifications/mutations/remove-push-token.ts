import { db } from "@seen/db";
import { pushTokens } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

export async function removePushToken(userId: string, token: string): Promise<{ ok: boolean }> {
  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
  return { ok: true };
}
