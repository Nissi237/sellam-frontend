import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");

  return (
    <button
      onClick={toggle}
      className="font-mono text-sm text-cream border border-cream/40 rounded-full px-3 py-1 hover:bg-cream/10 transition"
      aria-label="Switch language / Changer de langue"
    >
      {i18n.language === "fr" ? "EN" : "FR"}
    </button>
  );
}