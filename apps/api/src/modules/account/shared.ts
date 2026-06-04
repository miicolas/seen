// Mappers from Better Auth's camelCase/Date shapes to the snake-case/ISO rows
// the rest of the API returns. Kept explicit (rather than a generic toApiRow) so
// each response exactly matches its Elysia model.

type SessionLike = {
  id: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type UserLike = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AccountLike = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function mapSession(session: SessionLike) {
  return {
    id: session.id,
    token: session.token,
    created_at: iso(session.createdAt),
    updated_at: iso(session.updatedAt),
    expires_at: iso(session.expiresAt),
    ip_address: session.ipAddress ?? null,
    user_agent: session.userAgent ?? null,
  };
}

export function mapUser(user: UserLike) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.emailVerified,
    image: user.image ?? null,
    created_at: iso(user.createdAt),
    updated_at: iso(user.updatedAt),
  };
}

export function mapAccount(account: AccountLike) {
  return {
    id: account.id,
    provider_id: account.providerId,
    account_id: account.accountId,
    created_at: account.createdAt ? iso(account.createdAt) : null,
    updated_at: account.updatedAt ? iso(account.updatedAt) : null,
  };
}
