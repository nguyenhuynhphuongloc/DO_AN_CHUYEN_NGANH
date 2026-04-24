import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useMobile } from "../../hooks/useMobile";
import { useAuth } from "../../features/auth/AuthContext";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export function AppShell() {
  const location = useLocation();
  const { session, isBootstrapping, isAuthenticated, logout } = useAuth();
  const isMobile = useMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (isBootstrapping) {
    return <div className="app-shell-loading">Restoring your finance workspace...</div>;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="app-shell">
      <AppSidebar
        userName={session.user.full_name}
        userEmail={session.user.email}
        onLogout={logout}
        isMobileOpen={isMobile && isMobileOpen}
        onToggleMobile={() => setIsMobileOpen((current) => !current)}
      />
      <div className="app-shell__content">
        <AppHeader />
        <main className="app-shell__main">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
