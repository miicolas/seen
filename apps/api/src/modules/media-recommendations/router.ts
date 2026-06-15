import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { MediaRecommendationModel } from "./model";
import { countUnread, listReceived, listRecommendableFriends } from "./queries";
import { markRecommendationRead, sendRecommendation } from "./mutations";

export const mediaRecommendationController = new Elysia({
  name: "MediaRecommendation.Controller",
  prefix: "/media-recommendations",
})
  .use(authGuard)
  .use(MediaRecommendationModel)
  .post("/", ({ user, body }) => sendRecommendation(user.id, body), {
    auth: true,
    body: "mediaRecommendations.SendInput",
    response: { 200: "mediaRecommendations.SendResult" },
  })
  .get("/received", ({ user }) => listReceived(user.id), {
    auth: true,
    response: { 200: "mediaRecommendations.ReceivedList" },
  })
  .get("/unread-count", ({ user }) => countUnread(user.id), {
    auth: true,
    response: { 200: "mediaRecommendations.UnreadCount" },
  })
  .get("/recommendable-friends", ({ user }) => listRecommendableFriends(user.id), {
    auth: true,
    response: { 200: "mediaRecommendations.FriendList" },
  })
  .post("/:id/read", ({ user, params }) => markRecommendationRead(user.id, params.id), {
    auth: true,
    response: { 200: "mediaRecommendations.OkResponse" },
  });
