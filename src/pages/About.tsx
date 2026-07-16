import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Smartphone, Users, Check, ArrowRight } from "lucide-react";

const VALUE_ICONS = [ShieldCheck, Smartphone, Users];

export default function About() {
  const { t } = useTranslation();
  const values = t("about.values", { returnObjects: true }) as string[];
  const what = t("about.what", { returnObjects: true }) as string[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="receipt-stub bg-forest-300/30 border border-forest-300 p-8 sm:p-10 mb-10 text-center">
        <h1 className="font-display text-3xl sm:text-4xl text-forest-950 mb-3">{t("about.title")}</h1>
        <p className="font-body text-forest-800/80 max-w-2xl mx-auto">{t("about.lead")}</p>
      </section>

      {/* Mission + story */}
      <section className="grid md:grid-cols-2 gap-4 mb-10">
        <div className="receipt-stub bg-white border border-forest-300 p-6">
          <h2 className="font-display text-xl text-forest-950 mb-2">{t("about.missionTitle")}</h2>
          <p className="text-sm text-forest-800/80 leading-relaxed">{t("about.missionBody")}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-6">
          <h2 className="font-display text-xl text-forest-950 mb-2">{t("about.storyTitle")}</h2>
          <p className="text-sm text-forest-800/80 leading-relaxed">{t("about.storyBody")}</p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-10">
        <h2 className="font-display text-2xl text-forest-950 mb-4 text-center">{t("about.valuesTitle")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {values.map((v, i) => {
            const Icon = VALUE_ICONS[i] ?? ShieldCheck;
            const [head, ...rest] = v.split(" — ");
            return (
              <div key={i} className="receipt-stub bg-white border border-forest-300 p-5 text-center">
                <span className="inline-flex w-11 h-11 rounded-full bg-forest-300/40 items-center justify-center text-forest-800 mb-3">
                  <Icon size={22} />
                </span>
                <p className="font-body font-semibold text-forest-950">{head}</p>
                <p className="text-xs text-forest-500 mt-1">{rest.join(" — ")}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* What Sellam offers */}
      <section className="receipt-stub bg-white border border-forest-300 p-6 mb-10">
        <h2 className="font-display text-xl text-forest-950 mb-4">{t("about.whatTitle")}</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {what.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-forest-800/85">
              <Check size={16} className="text-leaf mt-0.5 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="receipt-stub bg-forest-800 text-cream p-8 text-center">
        <h2 className="font-display text-2xl mb-2">{t("about.ctaTitle")}</h2>
        <p className="text-cream/80 text-sm max-w-xl mx-auto mb-5">{t("about.ctaText")}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/sell" className="bg-leaf text-cream px-6 py-2.5 rounded-md font-medium hover:opacity-90 transition inline-flex items-center gap-2">
            {t("about.ctaSell")} <ArrowRight size={16} />
          </Link>
          <Link to="/browse" className="border border-cream/50 text-cream px-6 py-2.5 rounded-md font-medium hover:bg-cream/10 transition">
            {t("about.ctaBrowse")}
          </Link>
        </div>
      </section>
    </div>
  );
}
