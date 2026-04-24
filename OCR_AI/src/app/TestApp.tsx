import { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import { AuthProvider } from "../features/auth/AuthContext";
import { AppConfig, AppConfigProvider, defaultAppConfig } from "./config";
import { AppRoutes } from "./AppRoutes";

export function TestApp({
  config = defaultAppConfig,
  initialEntries = ["/"],
  children
}: {
  config?: AppConfig;
  initialEntries?: string[];
  children?: ReactNode;
}) {
  return (
    <AppConfigProvider value={config}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children ?? <AppRoutes />}
        </MemoryRouter>
      </AuthProvider>
    </AppConfigProvider>
  );
}
