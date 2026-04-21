import { MemoryRouter } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { AppConfig, AppConfigProvider, defaultAppConfig } from "./config";
import { AppRoutes } from "./AppRoutes";

export function TestApp({
  initialEntries = ["/login"],
  config = defaultAppConfig
}: {
  initialEntries?: string[];
  config?: AppConfig;
}) {
  return (
    <AppConfigProvider value={config}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </AppConfigProvider>
  );
}
