import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "../features/auth/AuthContext";
import { AppRoutes } from "./AppRoutes";
import { AppConfig, AppConfigProvider, defaultAppConfig } from "./config";

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
