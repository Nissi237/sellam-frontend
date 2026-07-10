import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ShoppingBasket, ShoppingCart } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useCart } from "../context/CartContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-forest-800 border-b-4 border-forest-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-cream font-display text-xl">
            <ShoppingBasket className="text-forest-300" size={24} />
            Sellam
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-cream font-body text-sm">
            <Link to="/browse" className="hover:text-forest-300 transition">{t("nav.browse")}</Link>
            <Link to="/sell" className="hover:text-forest-300 transition">{t("nav.sell")}</Link>
            <Link to="/login" className="hover:text-forest-300 transition">{t("nav.login")}</Link>
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
        Sellam © 2026 — Douala, Cameroun
      </footer>
    </div>
  );
}