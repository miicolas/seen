import { eden, unwrapEden } from "@/lib/eden";

export async function registerPushToken(input: {
  token: string;
  device_id?: string;
}): Promise<{ ok: boolean }> {
  return unwrapEden<{ ok: boolean }>(
    eden.notifications["push-tokens"].post({ ...input, platform: "ios" }),
  );
}
