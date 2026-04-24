import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

import { APP_NAME } from "../../lib/constants";
import { primaryNavigation } from "../../lib/navigation";
import { cn } from "../../lib/utils";
import { UserMenu } from "./UserMenu";

export function AppSidebar({
  userName,
  userEmail,
  onLogout,
  isMobileOpen,
  onToggleMobile
}: {
  userName: string;
  userEmail: string;
  onLogout: () => void;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
}) {
  return (
    <>
      <button className="sidebar-toggle" type="button" onClick={onToggleMobile}>
        <Menu size={18} />
        <span>Menu</span>
      </button>
      <aside className={cn("app-sidebar", isMobileOpen && "app-sidebar--open")}>
        <div className="app-sidebar__brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>{APP_NAME}</strong>
            <span>Finance workspace</span>
          </div>
        </div>

        <nav className="app-sidebar__nav">
          {primaryNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn("app-sidebar__link", isActive && "app-sidebar__link--active")}
              onClick={isMobileOpen ? onToggleMobile : undefined}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__user">
          <div className="avatar">{userName.slice(0, 2).toUpperCase()}</div>
          <div className="app-sidebar__identity">
            <strong>{userName}</strong>
            <span>{userEmail}</span>
          </div>
          <UserMenu name={userName} email={userEmail} onLogout={onLogout} />
        </div>
      </aside>
    </>
  );
}
