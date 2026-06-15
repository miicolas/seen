import type { ExpoPushMessage } from "../../lib/expo-push";

export type RecommendationNotification = {
  recommendationId: string;
  actorName: string;
  title: string;
};

export function recommendationPushMessages(
  event: RecommendationNotification,
  tokens: string[],
): ExpoPushMessage[] {
  return tokens.map((token) => ({
    to: token,
    title: "New recommendation",
    body: `${event.actorName} recommended ${event.title}.`,
    sound: "default",
    data: { type: "media-recommendation.received", recommendationId: event.recommendationId },
  }));
}
