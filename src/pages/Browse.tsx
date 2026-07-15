import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../api/endpoints";
import type { Product } from "../types/product";

const categories = [
  { value: "Tous", key: "all" },
  { value: "Fruits & légumes", key: "produce" },
  { value: "Provisions", key: "groceries" },
  { value: "Textiles", key: "textiles" },
] as const;

type CategoryValue = (typeof categories)[number]["value"];

export default function Browse() {
  const { t } = useTranslation();
  const [params] = useSearchParams();

  // Honour deep-links from the home page / header search (?category=, ?q=).
  const initialCategory = categories.find((c) => c.value === params.get("category"))?.value ?? "Tous";
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<CategoryValue>(initialCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError(t("browse.loadError")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = category === "Tous" || p.category === category;
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-forest-950 mb-6">
        {t("nav.browse")}
      </h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("browse.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-2 rounded-full text-sm font-body whitespace-nowrap transition ${
                category === c.value
                  ? "bg-forest-800 text-cream"
                  : "bg-forest-300/30 text-forest-800 hover:bg-forest-300/60"
              }`}
            >
              {t(`category.${c.key}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-forest-800/70 font-body text-center py-16">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-clay font-body text-center py-16">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-forest-800/70 font-body text-center py-16">
          {t("browse.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
