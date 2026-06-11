import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { NotificationModel } from "./model";
import { registerPushToken, removePushToken } from "./mutations";

export const notificationController = new Elysia({
  name: "Notification.Controller",
  prefix: "/notifications",
})
  .use(authGuard)
  .use(NotificationModel)
  .post("/push-tokens", ({ user, body }) => registerPushToken(user.id, body), {
    auth: true,
    body: "notifications.PushTokenInput",
    response: { 200: "notifications.OkResponse" },
  })
  .delete("/push-tokens", ({ user, query }) => removePushToken(user.id, query.token), {
    auth: true,
    query: "notifications.PushTokenQuery",
    response: { 200: "notifications.OkResponse" },
  });
