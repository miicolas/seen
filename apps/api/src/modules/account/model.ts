import { Elysia, t } from "elysia";

const sessionRow = t.Object({
  id: t.String(),
  token: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
  expires_at: t.String(),
  ip_address: t.Nullable(t.String()),
  user_agent: t.Nullable(t.String()),
});

const userRow = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  email_verified: t.Boolean(),
  image: t.Nullable(t.String()),
  created_at: t.String(),
  updated_at: t.String(),
});

const accountRow = t.Object({
  id: t.String(),
  provider_id: t.String(),
  account_id: t.String(),
  created_at: t.Nullable(t.String()),
  updated_at: t.Nullable(t.String()),
});

export const AccountModel = new Elysia({ name: "Account.Model" }).model({
  "account.Session": t.Object({ user: userRow, session: sessionRow }),
  "account.SessionList": t.Array(sessionRow),
  "account.AccountList": t.Array(accountRow),
  "account.User": userRow,
  "account.UpdateUserBody": t.Object({
    name: t.Optional(t.String({ minLength: 1 })),
    image: t.Optional(t.Nullable(t.String())),
  }),
  "account.ChangePasswordBody": t.Object({
    currentPassword: t.String({ minLength: 1 }),
    newPassword: t.String({ minLength: 8 }),
    revokeOtherSessions: t.Optional(t.Boolean()),
  }),
  "account.ChangeEmailBody": t.Object({
    newEmail: t.String({ format: "email" }),
    callbackURL: t.Optional(t.String()),
  }),
  "account.RevokeSessionBody": t.Object({
    token: t.String({ minLength: 1 }),
  }),
  "account.UnlinkAccountBody": t.Object({
    providerId: t.String({ minLength: 1 }),
    accountId: t.Optional(t.String()),
  }),
  "account.DeleteBody": t.Object({
    password: t.Optional(t.String()),
  }),
  "account.OkResponse": t.Object({ ok: t.Boolean() }),
});

export const accountModels = AccountModel.models;
