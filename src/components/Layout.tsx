import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBasket, ShoppingCart, User as UserIcon, Search, LayoutDashboard } from "lucide-react";
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
      <header className="bg-forest-800">
        {/* Top row: logo · search · utility */}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 justify-between">
          <Link to="/" className="flex items-center gap-2 text-cream font-display text-xl shrink-0">
            <ShoppingBasket className="text-forest-300" size={24} />
            Sellam
          </Link>

          {/* Header search — deep-links into Browse */}
          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-lg relative">
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

          <div className="flex items-center gap-4 text-cream shrink-0">
            {isAuthenticated && <NotificationsBell />}
            {isAuthenticated &&
              (user?.role === "individual_buyer" || user?.role === "corporate_buyer") && (
                <Link to="/dashboard" className="flex items-center gap-1 text-sm hover:text-forest-300 transition" title={t("buyerDash.title")}>
                  <LayoutDashboard size={16} /> <span className="hidden sm:inline">{t("buyerDash.title")}</span>
                </Link>
              )}
            {isAuthenticated ? (
              <Link to="/account" className="flex items-center gap-1 text-sm hover:text-forest-300 transition">
                <UserIcon size={16} /> <span className="hidden sm:inline">{user?.fullName?.split(" ")[0] ?? t("nav.account")}</span>
              </Link>
            ) : (
              <Link to="/login" className="text-sm hover:text-forest-300 transition">{t("nav.login")}</Link>
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
          </div>
        </div>

        {/* Primary menu bar */}
        <nav className="bg-forest-950 border-t border-forest-800">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-5 text-cream font-body text-sm overflow-x-auto whitespace-nowrap">
            {[
              { to: "/", label: t("nav.home") },
              { to: "/browse", label: t("nav.browse") },
              { to: "/about", label: t("nav.about") },
              { to: "/faq", label: t("nav.faq") },
              { to: "/contact", label: t("nav.contact") },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="py-2.5 hover:text-forest-300 transition">{l.label}</Link>
            ))}
            <span className="w-px h-4 bg-forest-800 shrink-0" />
            <Link to="/sell" className="py-2.5 hover:text-forest-300 transition">{t("nav.sell")}</Link>
            {isAuthenticated && (user?.role === "seller" || user?.role === "corporate_buyer") && (
              <>
                <Link to="/rfqs" className="py-2.5 hover:text-forest-300 transition">{t("nav.rfqs")}</Link>
                <Link to="/invoices" className="py-2.5 hover:text-forest-300 transition">{t("nav.invoices")}</Link>
              </>
            )}
            {isAuthenticated && user?.role === "seller" && (
              <Link to="/financing" className="py-2.5 hover:text-forest-300 transition">{t("nav.financing")}</Link>
            )}
            {isAuthenticated && user?.role === "delivery_agent" && (
              <Link to="/deliver" className="py-2.5 hover:text-forest-300 transition">{t("nav.deliver")}</Link>
            )}
            {isAuthenticated && user?.role === "admin" && (
              <Link to="/admin" className="py-2.5 hover:text-forest-300 transition">{t("nav.admin")}</Link>
            )}
            {isAuthenticated && (
              <Link to="/messages" className="py-2.5 hover:text-forest-300 transition">{t("nav.messages")}</Link>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-forest-950 text-cream/60 text-sm text-center py-6 font-mono">
        {t("footer")}
      </footer>
    </div>
  );
}