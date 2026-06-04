import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { AccountModel } from "./model";
import { getMySession, listMyAccounts, listMySessions } from "./queries";
import {
  changeMyEmail,
  changeMyPassword,
  deleteMyUser,
  revokeOtherSessions,
  revokeSession,
  unlinkAccount,
  updateMyUser,
} from "./mutations";

// Self-service account/session management. Each route wraps a Better Auth
// server method (`auth.api.*`), passing the request headers through so the
// operation runs as the signed-in user — same pattern as `authGuard`.
export const accountController = new Elysia({
  name: "Account.Controller",
  prefix: "/account",
})
  .use(authGuard)
  .use(AccountModel)
  .get("/session", ({ request }) => getMySession(request.headers), {
    auth: true,
    response: { 200: "account.Session" },
  })
  .get("/sessions", ({ request }) => listMySessions(request.headers), {
    auth: true,
    response: { 200: "account.SessionList" },
  })
  .post(
    "/sessions/revoke",
    ({ request, body }) => revokeSession(request.headers, body),
    {
      auth: true,
      body: "account.RevokeSessionBody",
      response: { 200: "account.OkResponse" },
    },
  )
  .post(
    "/sessions/revoke-others",
    ({ request }) => revokeOtherSessions(request.headers),
    {
      auth: true,
      response: { 200: "account.OkResponse" },
    },
  )
  .get("/accounts", ({ request }) => listMyAccounts(request.headers), {
    auth: true,
    response: { 200: "account.AccountList" },
  })
  .post(
    "/accounts/unlink",
    ({ request, body }) => unlinkAccount(request.headers, body),
    {
      auth: true,
      body: "account.UnlinkAccountBody",
      response: { 200: "account.OkResponse" },
    },
  )
  .patch("/user", ({ request, body }) => updateMyUser(request.headers, body), {
    auth: true,
    body: "account.UpdateUserBody",
    response: { 200: "account.User" },
  })
  .post(
    "/change-password",
    ({ request, body }) => changeMyPassword(request.headers, body),
    {
      auth: true,
      body: "account.ChangePasswordBody",
      response: { 200: "account.OkResponse" },
    },
  )
  .post(
    "/change-email",
    ({ request, body }) => changeMyEmail(request.headers, body),
    {
      auth: true,
      body: "account.ChangeEmailBody",
      response: { 200: "account.OkResponse" },
    },
  )
  .delete("/", ({ request, body }) => deleteMyUser(request.headers, body), {
    auth: true,
    body: "account.DeleteBody",
    response: { 200: "account.OkResponse" },
  });
