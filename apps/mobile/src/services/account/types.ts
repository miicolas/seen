export interface AccountSession {
  id: string;
  token: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface LinkedAccount {
  id: string;
  provider_id: string;
  account_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountSessionInfo {
  user: AccountUser;
  session: AccountSession;
}
