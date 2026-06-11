import { describe, expect, it } from "bun:test";

import { pushMessagesForEvent, type WatchEventType } from "./notification-rules";

function event(type: WatchEventType) {
  return {
    type,
    sessionId: "session-1",
    sessionTitle: "Heat",
    actorName: "Alice",
    recipientUserId: "user-2",
  };
}

describe("pushMessagesForEvent", () => {
  it("builds one message per device token for invitation lifecycle events", () => {
    for (const type of ["invited", "accepted", "declined", "canceled"] as const) {
      const messages = pushMessagesForEvent(event(type), ["tok-a", "tok-b"]);
      expect(messages).toHaveLength(2);
      expect(messages[0]!.to).toBe("tok-a");
      expect(messages[0]!.data).toEqual({ type: `watch-session.${type}`, sessionId: "session-1" });
      expect(messages[0]!.body).toContain("Heat");
    }
  });

  it("never pushes for progress events", () => {
    for (const type of ["paused", "resumed", "seeked", "finished"] as const) {
      expect(pushMessagesForEvent(event(type), ["tok-a"])).toEqual([]);
    }
  });

  it("returns nothing without device tokens", () => {
    expect(pushMessagesForEvent(event("invited"), [])).toEqual([]);
  });
});
