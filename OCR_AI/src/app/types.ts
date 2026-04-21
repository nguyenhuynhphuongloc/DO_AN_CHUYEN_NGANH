export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  status: string;
  email_verified: boolean;
  last_login_at?: string | null;
  roles: string[];
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_expires_at: string;
  refresh_expires_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface WalletOption {
  id: string;
  name: string;
  currency: string;
  balance: number;
  is_default?: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  category_type: string;
  is_active?: boolean;
}
