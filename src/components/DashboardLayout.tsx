import { useState, type ComponentType, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingBasket, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationsBell from "./NotificationsBell";
import LanguageSwitcher from "./LanguageSwitcher";

export interface DashboardNavItem {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  to: string;
  /** In-shell routes get an active highlight; links-out just navigate away. */
  end?: boolean;
}

/**
 * Sidebar shell for the buyer dashboards. Dark forest sidebar (app palette) with
 * a role-driven nav, a collapsible drawer on mobile, and a top bar carrying the
 * welcome line plus the shared NotificationsBell / LanguageSwitcher.
 */
export default function DashboardLayout({
  title,
  nav,
  children,
  actions,
}: {
  title: string;
  nav: DashboardNavItem[];
  children: ReactNode;
  /** Optional top-bar controls (e.g. the seller's "New listing" button). */
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const firstName = user?.fullName?.split(" ")[0] ?? "";

  const doLogout = () => {
    logout();
    navigate("/");
  };

  const linkBase =
    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body transition";

  const sidebar = (
    <div className="flex flex-col h-full bg-forest-950 text-cream w-60">
      {/* Brand */}
      <Link
        to="/"
        className="flex items-center gap-2 font-display text-xl px-5 py-4 shrink-0"
        onClick={() => setOpen(false)}
      >
        <ShoppingBasket className="text-forest-300" size={24} />
        Sellam
      </Link>

      {/* Main menu */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-[11px] uppercase tracking-wider text-forest-500 px-3 mt-2 mb-1">
          {t("buyerDash.mainMenu")}
        </p>
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-forest-800 text-cream"
                    : "text-cream/70 hover:bg-forest-800/60 hover:text-cream"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Account group pinned to the bottom */}
      <div className="border-t border-forest-800 px-3 py-3 shrink-0">
        <p className="text-[11px] uppercase tracking-wider text-forest-500 px-3 mb-2">
          {t("buyerDash.accountGroup")}
        </p>
        <div className="flex items-center gap-3 px-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-forest-800 flex items-center justify-center text-cream text-sm font-display">
            {firstName.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-cream truncate">{user?.fullName}</p>
            <p className="text-[11px] text-forest-500 truncate">
              {t(`role.${user?.role}`, user?.role ?? "")}
            </p>
          </div>
        </div>
        <button
          onClick={doLogout}
          className={`${linkBase} w-full text-cream/70 hover:bg-forest-800/60 hover:text-cream`}
        >
          <LogOut size={18} /> {t("buyerDash.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-cream/40">
      {/* Desktop sidebar */}
      <aside className="hidden md:block shrink-0">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-forest-950/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-xl">{sidebar}</div>
        </div>
      )}

      {/* Content column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b border-forest-300">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-forest-800 p-1"
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg text-forest-950 leading-tight">
              {title}
            </h1>
            {firstName && (
              <p className="text-xs text-forest-500 truncate">
                {t("buyerDash.welcome", { name: firstName })}
              </p>
            )}
          </div>
          {actions}
          <NotificationsBell />
          <LanguageSwitcher />
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Close button floating for the open mobile drawer */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed top-3 right-3 z-50 md:hidden text-cream bg-forest-800 rounded-full p-1"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
