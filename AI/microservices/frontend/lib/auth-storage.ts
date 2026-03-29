const STORAGE_KEY = 'finance-mvp-auth';

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  email: string;
};

export function saveAuthSession(session: StoredAuth) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as StoredAuth) : null;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
