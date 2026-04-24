import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { useAppConfig } from "../../app/config";
import type { AuthSession, LoginPayload, RegisterPayload } from "../../types/auth";
import { fetchCurrentUser, loginWithAuthService, registerWithAuthService } from "./services/authService";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "./storage";

interface AuthContextValue {
  session: AuthSession | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload, fetchImpl?: typeof fetch) => Promise<AuthSession>;
  login: (payload: LoginPayload, fetchImpl?: typeof fetch) => Promise<AuthSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const config = useAppConfig();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const stored = loadAuthSession();
    if (!stored) {
      setIsBootstrapping(false);
      return;
    }

    fetchCurrentUser(config.authServiceUrl, stored.access_token)
      .then((response) => {
        const nextSession = { ...stored, user: response.user };
        saveAuthSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        clearAuthSession();
        setSession(null);
      })
      .finally(() => setIsBootstrapping(false));
  }, [config.authServiceUrl]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping,
      isAuthenticated: Boolean(session),
      async register(payload, fetchImpl) {
        const nextSession = await registerWithAuthService(config.authServiceUrl, payload, fetchImpl);
        saveAuthSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      async login(payload, fetchImpl) {
        const nextSession = await loginWithAuthService(config.authServiceUrl, payload, fetchImpl);
        saveAuthSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      logout() {
        clearAuthSession();
        setSession(null);
      }
    }),
    [config.authServiceUrl, isBootstrapping, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
