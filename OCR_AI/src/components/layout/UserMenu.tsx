import { LogOut, Lock, Settings, User } from "lucide-react";

import { useUserMenu } from "../../hooks/useUserMenu";

const menuItems = [
  { label: "Profile", icon: User },
  { label: "Settings", icon: Settings },
  { label: "Security", icon: Lock }
];

export function UserMenu({
  name,
  email,
  onLogout
}: {
  name: string;
  email: string;
  onLogout: () => void;
}) {
  const { isOpen, setIsOpen, ref } = useUserMenu();

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="icon-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open user menu"
      >
        <Settings size={16} />
      </button>
      {isOpen ? (
        <div className="user-menu__dropdown">
          <div className="user-menu__meta">
            <strong>{name}</strong>
            <span>{email}</span>
          </div>
          {menuItems.map((item) => (
            <button key={item.label} className="user-menu__item" type="button">
              <item.icon size={15} />
              <span>{item.label}</span>
            </button>
          ))}
          <button className="user-menu__item user-menu__item--logout" type="button" onClick={onLogout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
