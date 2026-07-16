import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, MessageCircle } from "lucide-react";

export default function FAQ() {
  const { t } = useTranslation();
  const items = t("faq.items", { returnObjects: true }) as { q: string; a: string }[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-forest-950 mb-1">{t("faq.title")}</h1>
      <p className="text-sm text-forest-500 mb-8">{t("faq.subtitle")}</p>

      <div className="flex flex-col gap-2">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="receipt-stub bg-white border border-forest-300 overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-body font-semibold text-forest-950">{it.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-forest-800 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 -mt-1">
                  <p className="text-sm text-forest-800/80 leading-relaxed">{it.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still need help */}
      <div className="mt-8 receipt-stub bg-forest-300/25 border border-forest-300 p-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-forest-800">{t("contact.subtitle")}</p>
        <Link to="/contact" className="inline-flex items-center gap-2 bg-forest-800 text-cream px-5 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition">
          <MessageCircle size={16} /> {t("nav.contact")}
        </Link>
      </div>
    </div>
  );
}
