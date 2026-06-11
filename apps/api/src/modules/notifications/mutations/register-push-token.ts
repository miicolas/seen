import { db } from "@seen/db";
import { pushTokens } from "@seen/db/schema";

export type RegisterPushTokenInput = {
  token: string;
  device_id?: string | null;
  platform?: string;
};

export async function registerPushToken(
  userId: string,
  input: RegisterPushTokenInput,
): Promise<{ ok: boolean }> {
  await db
    .insert(pushTokens)
    .values({
      userId,
      token: input.token,
      deviceId: input.device_id ?? null,
      platform: input.platform ?? "ios",
    })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: {
        userId,
        deviceId: input.device_id ?? null,
        platform: input.platform ?? "ios",
        lastSeenAt: new Date(),
      },
    });
  return { ok: true };
}
