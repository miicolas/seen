import { db } from "@seen/db";
import { profiles, pushTokens } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { sendExpoPush } from "../../lib/expo-push";
import { maybeTrigger } from "../../lib/trigger";
import { pushMessagesForEvent, type WatchEventType } from "./notification-rules";

export async function notifyWatchEvent(event: {
  type: WatchEventType;
  sessionId: string;
  sessionTitle: string;
  actorId: string;
  recipientUserId: string;
}): Promise<void> {
  try {
    const [tokens, [actor]] = await Promise.all([
      db
        .select({ token: pushTokens.token })
        .from(pushTokens)
        .where(eq(pushTokens.userId, event.recipientUserId)),
      db
        .select({ fullName: profiles.fullName })
        .from(profiles)
        .where(eq(profiles.id, event.actorId)),
    ]);
    const messages = pushMessagesForEvent(
      { ...event, actorName: actor?.fullName ?? "Someone" },
      tokens.map((row) => row.token),
    );
    if (messages.length === 0) return;
    const enqueued = maybeTrigger("send-push", { messages });
    if (!enqueued) await sendExpoPush(messages);
  } catch (error) {
    console.error("watch-sessions: push dispatch failed", error);
  }
}
