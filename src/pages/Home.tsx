import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Smartphone, Truck, ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../api/endpoints";
import type { Product } from "../types/product";
import heroImg from "../assets/home/hero-market-fabrics.jpg";
import produceImg from "../assets/home/category-produce.jpg";
import groceriesImg from "../assets/home/category-groceries.jpg";
import textilesImg from "../assets/home/category-textiles.jpg";
import promoRice from "../assets/home/promo-rice.jpg";
import promoFish from "../assets/home/promo-fish.jpg";
import promoPlantains from "../assets/home/promo-plantains.jpg";
import fallbackImg from "../assets/home/fallback-produce.jpg";

// Real Douala/West-African market photography, bundled locally. FALLBACK
// guarantees every tile shows a relevant photo even if an image fails to load.
const FALLBACK = fallbackImg;
const IMG = {
  hero: heroImg,
  produce: produceImg,
  groceries: groceriesImg,
  textiles: textilesImg,
  promo1: promoFish,
  promo2: promoRice,
  promo3: promoPlantains,
};

/** Swap a broken remote image for a known-good relevant photo. */
const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== FALLBACK) e.currentTarget.src = FALLBACK;
};

const CATEGORIES = [
  { key: "produce", value: "Fruits & légumes", img: IMG.produce },
  { key: "groceries", value: "Provisions", img: IMG.groceries },
  { key: "textiles", value: "Textiles", img: IMG.textiles },
];

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("all");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const countFor = (value: string) => products.filter((p) => p.category === value).length;

  // Popular = sponsored first, then best-reviewed; capped at 8 for the landing rail.
  const popular = useMemo(() => {
    const pool = activeCat === "all" ? products : products.filter((p) => p.category === activeCat);
    return [...pool]
      .sort((a, b) => {
        if (!!b.sponsored !== !!a.sponsored) return b.sponsored ? 1 : -1;
        return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      })
      .slice(0, 8);
  }, [products, activeCat]);

  const features = [
    { Icon: ShieldCheck, title: t("home.feature1Title"), sub: t("home.feature1Sub") },
    { Icon: Smartphone, title: t("home.feature2Title"), sub: t("home.feature2Sub") },
    { Icon: Truck, title: t("home.feature3Title"), sub: t("home.feature3Sub") },
  ];

  const promos = [
    { title: t("home.promo1Title"), img: IMG.promo1, tint: "bg-forest-300/40" },
    { title: t("home.promo2Title"), img: IMG.promo2, tint: "bg-cream" },
    { title: t("home.promo3Title"), img: IMG.promo3, tint: "bg-clay/15" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* ---- Hero ---- */}
      <section className="receipt-stub overflow-hidden grid md:grid-cols-2 border border-forest-300 mb-10">
        <div className="bg-forest-300/40 p-8 sm:p-10 flex flex-col justify-center order-2 md:order-1">
          <p className="font-mono text-xs sm:text-sm text-clay uppercase tracking-widest mb-3">
            {t("home.eyebrow")}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl leading-tight text-forest-950 mb-4">
            {t("home.headline")}
          </h1>
          <p className="font-body text-base sm:text-lg text-forest-800/80 mb-5 max-w-md">
            {t("home.subhead")}
          </p>
          <span className="inline-flex w-fit items-center gap-2 bg-leaf/15 text-forest-800 font-mono text-xs sm:text-sm px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-leaf" /> {t("home.heroPromo")}
          </span>
          <Link
            to="/browse"
            className="inline-flex w-fit items-center gap-2 bg-forest-800 text-cream px-6 py-3 rounded-md font-medium hover:bg-forest-950 transition"
          >
            {t("home.shopNow")} <ArrowRight size={18} />
          </Link>
        </div>
        <div className="order-1 md:order-2 min-h-[220px] md:min-h-0">
          <img
            src={IMG.hero}
            onError={onImgError}
            alt={t("home.headline")}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* ---- Trust features ---- */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {features.map(({ Icon, title, sub }) => (
          <div
            key={title}
            className="flex items-center gap-3 bg-white border border-forest-300 rounded-lg p-4"
          >
            <span className="shrink-0 w-11 h-11 rounded-full bg-forest-300/40 flex items-center justify-center text-forest-800">
              <Icon size={22} />
            </span>
            <div>
              <p className="font-body font-semibold text-forest-950 leading-tight">{title}</p>
              <p className="text-xs text-forest-500">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ---- Featured categories ---- */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl text-forest-950">{t("home.featuredCategories")}</h2>
          <Link to="/browse" className="text-sm text-forest-800 hover:text-forest-950 inline-flex items-center gap-1">
            {t("home.viewAll")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to={`/browse?category=${encodeURIComponent(c.value)}`}
              className="group receipt-stub bg-white border border-forest-300 hover:shadow-md transition overflow-hidden text-center"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={c.img}
                  onError={onImgError}
                  alt={t(`category.${c.key}`)}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-3">
                <p className="font-body font-semibold text-forest-950 leading-tight">
                  {t(`category.${c.key}`)}
                </p>
                <p className="text-xs text-forest-500">
                  {t("home.itemsCount", { count: countFor(c.value) })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Promo banners ---- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {promos.map((p) => (
          <div
            key={p.title}
            className={`receipt-stub ${p.tint} border border-forest-300 flex items-center gap-3 p-4 overflow-hidden`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-display text-base text-forest-950 leading-snug mb-3">{p.title}</p>
              <Link
                to="/browse"
                className="inline-flex items-center gap-1 text-sm font-medium text-forest-800 hover:text-forest-950"
              >
                {t("home.shopNow")} <ArrowRight size={14} />
              </Link>
            </div>
            <img
              src={p.img}
              onError={onImgError}
              alt=""
              className="w-24 h-24 object-cover rounded-lg shrink-0"
            />
          </div>
        ))}
      </section>

      {/* ---- Popular products ---- */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <h2 className="font-display text-2xl text-forest-950">{t("home.popular")}</h2>
          <div className="flex gap-2 overflow-x-auto">
            <FilterTab active={activeCat === "all"} onClick={() => setActiveCat("all")}>
              {t("category.all")}
            </FilterTab>
            {CATEGORIES.map((c) => (
              <FilterTab key={c.key} active={activeCat === c.value} onClick={() => setActiveCat(c.value)}>
                {t(`category.${c.key}`)}
              </FilterTab>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="receipt-stub bg-forest-300/20 border border-forest-300 h-64 animate-pulse" />
            ))}
          </div>
        ) : popular.length === 0 ? (
          <p className="text-forest-800/70 font-body text-center py-12">{t("browse.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 border border-forest-800 text-forest-800 px-6 py-2.5 rounded-md font-medium hover:bg-forest-800 hover:text-cream transition"
          >
            {t("home.viewAll")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-body whitespace-nowrap transition ${
        active ? "bg-forest-800 text-cream" : "bg-forest-300/30 text-forest-800 hover:bg-forest-300/60"
      }`}
    >
      {children}
    </button>
  );
}
