import { Elysia, t } from "elysia";

export const NotificationModel = new Elysia({
  name: "Notification.Model",
}).model({
  "notifications.PushTokenInput": t.Object({
    token: t.String({ minLength: 1 }),
    device_id: t.Optional(t.Nullable(t.String())),
    platform: t.Optional(t.String()),
  }),
  "notifications.PushTokenQuery": t.Object({
    token: t.String({ minLength: 1 }),
  }),
  "notifications.OkResponse": t.Object({
    ok: t.Boolean(),
  }),
});

export const notificationModels = NotificationModel.models;
