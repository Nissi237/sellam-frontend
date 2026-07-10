import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 text-center">
      <p className="font-mono text-sm text-clay uppercase tracking-widest mb-3">
        {t("home.eyebrow")}
      </p>
      <h1 className="font-display text-4xl sm:text-6xl leading-tight mb-4 text-forest-950">
        {t("home.headline")}
      </h1>
      <p className="font-body text-lg text-forest-800/70 max-w-xl mx-auto">
        {t("home.subhead")}
      </p>
    </section>
  );
}