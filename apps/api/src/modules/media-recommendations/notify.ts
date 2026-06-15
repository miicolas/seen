import { db } from "@seen/db";
import { profiles, pushTokens } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { sendExpoPush } from "../../lib/expo-push";
import { maybeTrigger } from "../../lib/trigger";
import { recommendationPushMessages } from "./notification-rules";

export async function notifyRecommendation(event: {
  recommendationId: string;
  recipientUserId: string;
  actorId: string;
  title: string;
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
    const messages = recommendationPushMessages(
      {
        recommendationId: event.recommendationId,
        actorName: actor?.fullName ?? "Someone",
        title: event.title,
      },
      tokens.map((row) => row.token),
    );
    if (messages.length === 0) return;
    const enqueued = maybeTrigger("send-push", { messages });
    if (!enqueued) await sendExpoPush(messages);
  } catch (error) {
    console.error("media-recommendations: push dispatch failed", error);
  }
}
