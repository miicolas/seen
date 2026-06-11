import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { WatchSessionModel } from "./model";
import {
  getCurrentSession,
  getSessionDetail,
  listIncomingInvitations,
  listInvitableFriends,
} from "./queries";
import {
  acceptInvitation,
  applySessionAction,
  cancelInvitation,
  cancelSession,
  declineInvitation,
  inviteToSession,
  startSession,
} from "./mutations";

export const watchSessionController = new Elysia({
  name: "WatchSession.Controller",
  prefix: "/watch-sessions",
})
  .use(authGuard)
  .use(WatchSessionModel)
  .post("/", ({ user, body }) => startSession(user.id, body), {
    auth: true,
    body: "watchSessions.StartInput",
    response: { 200: "watchSessions.Session" },
  })
  .get("/current", ({ user }) => getCurrentSession(user.id), {
    auth: true,
    response: { 200: "watchSessions.NullableSession" },
  })
  .get("/invitations", ({ user }) => listIncomingInvitations(user.id), {
    auth: true,
    response: { 200: "watchSessions.InvitationList" },
  })
  .post(
    "/invitations/:invitationId/accept",
    ({ user, params, body }) =>
      acceptInvitation(user.id, params.invitationId, body.from_beginning ?? true),
    {
      auth: true,
      body: "watchSessions.AcceptInput",
      response: { 200: "watchSessions.Session" },
    },
  )
  .post(
    "/invitations/:invitationId/decline",
    ({ user, params }) => declineInvitation(user.id, params.invitationId),
    { auth: true, response: { 200: "watchSessions.OkResponse" } },
  )
  .post(
    "/invitations/:invitationId/cancel",
    ({ user, params }) => cancelInvitation(user.id, params.invitationId),
    { auth: true, response: { 200: "watchSessions.OkResponse" } },
  )
  .get("/:sessionId", ({ user, params }) => getSessionDetail(user.id, params.sessionId), {
    auth: true,
    response: { 200: "watchSessions.SessionDetail" },
  })
  .get(
    "/:sessionId/invitable-friends",
    ({ user, params }) => listInvitableFriends(user.id, params.sessionId),
    { auth: true, response: { 200: "watchSessions.FriendList" } },
  )
  .post(
    "/:sessionId/invitations",
    ({ user, params, body }) => inviteToSession(user.id, params.sessionId, body.invitee_id),
    {
      auth: true,
      body: "watchSessions.InviteInput",
      response: { 200: "watchSessions.Invitation" },
    },
  )
  .post(
    "/:sessionId/pause",
    ({ user, params }) => applySessionAction(user.id, params.sessionId, { type: "pause" }),
    { auth: true, response: { 200: "watchSessions.Session" } },
  )
  .post(
    "/:sessionId/resume",
    ({ user, params }) => applySessionAction(user.id, params.sessionId, { type: "resume" }),
    { auth: true, response: { 200: "watchSessions.Session" } },
  )
  .post(
    "/:sessionId/seek",
    ({ user, params, body }) =>
      applySessionAction(user.id, params.sessionId, {
        type: "seek",
        positionSeconds: body.position_seconds,
      }),
    { auth: true, body: "watchSessions.SeekInput", response: { 200: "watchSessions.Session" } },
  )
  .post(
    "/:sessionId/finish",
    ({ user, params }) => applySessionAction(user.id, params.sessionId, { type: "finish" }),
    { auth: true, response: { 200: "watchSessions.Session" } },
  )
  .post("/:sessionId/cancel", ({ user, params }) => cancelSession(user.id, params.sessionId), {
    auth: true,
    response: { 200: "watchSessions.OkResponse" },
  });
