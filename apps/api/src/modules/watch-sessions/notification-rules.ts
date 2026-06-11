import type { ExpoPushMessage } from "../../lib/expo-push";

export type WatchEventType =
  | "invited"
  | "accepted"
  | "declined"
  | "canceled"
  | "paused"
  | "resumed"
  | "seeked"
  | "finished";

export type WatchNotificationEvent = {
  type: WatchEventType;
  sessionId: string;
  sessionTitle: string;
  actorName: string;
  recipientUserId: string;
};

const PUSHABLE_EVENTS: ReadonlySet<WatchEventType> = new Set([
  "invited",
  "accepted",
  "declined",
  "canceled",
]);

function messageBody(event: WatchNotificationEvent): { title: string; body: string } | null {
  switch (event.type) {
    case "invited":
      return {
        title: "Watch together?",
        body: `${event.actorName} invited you to watch ${event.sessionTitle}.`,
      };
    case "accepted":
      return {
        title: "Ready to watch",
        body: `${event.actorName} joined your ${event.sessionTitle} session.`,
      };
    case "declined":
      return {
        title: "Invitation declined",
        body: `${event.actorName} can't watch ${event.sessionTitle} right now.`,
      };
    case "canceled":
      return {
        title: "Session canceled",
        body: `${event.actorName} canceled the ${event.sessionTitle} session.`,
      };
    default:
      return null;
  }
}

export function pushMessagesForEvent(
  event: WatchNotificationEvent,
  tokens: string[],
): ExpoPushMessage[] {
  if (!PUSHABLE_EVENTS.has(event.type)) return [];
  const content = messageBody(event);
  if (!content) return [];
  return tokens.map((token) => ({
    to: token,
    title: content.title,
    body: content.body,
    sound: "default",
    data: { type: `watch-session.${event.type}`, sessionId: event.sessionId },
  }));
}
