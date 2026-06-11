import { task } from "@trigger.dev/sdk";

import { sendExpoPush, type ExpoPushMessage } from "../lib/expo-push";

export const sendPushTask = task({
  id: "send-push",
  run: async (payload: { messages: ExpoPushMessage[] }) => {
    await sendExpoPush(payload.messages);
    return { sent: payload.messages.length };
  },
});
