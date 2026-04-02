const STORAGE_KEY = 'finance-mvp-auth';

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  email: string;
};

export class MissingAuthSessionError extends Error {
  constructor(message = 'Please sign in to continue') {
    super(message);
    this.name = 'MissingAuthSessionError';
  }
}

export function saveAuthSession(session: StoredAuth) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (
      typeof parsed.accessToken === 'string' &&
      typeof parsed.refreshToken === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return parsed as StoredAuth;
    }
  } catch {
    clearAuthSession();
  }

  return null;
}

export function requireAuthSession(): StoredAuth {
  const session = getAuthSession();

  if (!session?.accessToken) {
    throw new MissingAuthSessionError();
  }

  return session;
}

export function getAccessToken(): string | null {
  return getAuthSession()?.accessToken ?? null;
}

export function requireAccessToken(): string {
  return requireAuthSession().accessToken;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
