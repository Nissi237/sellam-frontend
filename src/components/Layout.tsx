import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBasket, ShoppingCart, User as UserIcon, Search } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationsBell from "./NotificationsBell";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(search.trim() ? `/browse?q=${encodeURIComponent(search.trim())}` : "/browse");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Announcement bar */}
      <div className="bg-forest-950 text-cream/80 text-center text-xs font-mono py-1.5 px-4">
        {t("home.announce")}
      </div>

      <header className="bg-forest-800 border-b-4 border-forest-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4 justify-between">
          <Link to="/" className="flex items-center gap-2 text-cream font-display text-xl shrink-0">
            <ShoppingBasket className="text-forest-300" size={24} />
            Sellam
          </Link>

          {/* Header search — deep-links into Browse */}
          <form onSubmit={onSearch} className="hidden lg:flex flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("browse.searchPlaceholder")}
              className="w-full pl-9 pr-20 py-2 rounded-md bg-cream text-forest-950 text-sm placeholder:text-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-300"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-forest-950 text-cream text-xs px-3 py-1.5 rounded hover:bg-forest-800 transition"
            >
              {t("nav.browse")}
            </button>
          </form>

          <nav className="hidden sm:flex items-center gap-6 text-cream font-body text-sm shrink-0">
            <Link to="/browse" className="hover:text-forest-300 transition">{t("nav.browse")}</Link>
            <Link to="/sell" className="hover:text-forest-300 transition">{t("nav.sell")}</Link>
            {isAuthenticated && (user?.role === "seller" || user?.role === "corporate_buyer") && (
              <>
                <Link to="/rfqs" className="hover:text-forest-300 transition">{t("nav.rfqs")}</Link>
                <Link to="/invoices" className="hover:text-forest-300 transition">{t("nav.invoices")}</Link>
              </>
            )}
            {isAuthenticated && user?.role === "seller" && (
              <Link to="/financing" className="hover:text-forest-300 transition">{t("nav.financing")}</Link>
            )}
            {isAuthenticated && user?.role === "delivery_agent" && (
              <Link to="/deliver" className="hover:text-forest-300 transition">{t("nav.deliver")}</Link>
            )}
            {isAuthenticated && user?.role === "admin" && (
              <Link to="/admin" className="hover:text-forest-300 transition">{t("nav.admin")}</Link>
            )}
            {isAuthenticated && (
              <Link to="/messages" className="hover:text-forest-300 transition">{t("nav.messages")}</Link>
            )}
            {isAuthenticated && <NotificationsBell />}
            {isAuthenticated ? (
              <Link to="/account" className="flex items-center gap-1 hover:text-forest-300 transition">
                <UserIcon size={16} /> {user?.fullName?.split(" ")[0] ?? t("nav.account")}
              </Link>
            ) : (
              <Link to="/login" className="hover:text-forest-300 transition">{t("nav.login")}</Link>
            )}
            <Link to="/cart" className="relative hover:text-forest-300 transition">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-clay text-cream text-[10px] font-mono rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-forest-950 text-cream/60 text-sm text-center py-6 font-mono">
        {t("footer")}
      </footer>
    </div>
  );
}