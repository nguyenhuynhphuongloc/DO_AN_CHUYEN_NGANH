import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { AppConfig, AppConfigProvider, defaultAppConfig } from "./config";
import { AppRoutes } from "./AppRoutes";

export function App({ config = defaultAppConfig }: { config?: AppConfig }) {
  return (
    <AppConfigProvider value={config}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AppConfigProvider>
  );
}
