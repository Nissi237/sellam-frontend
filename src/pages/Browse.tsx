import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { mockProducts } from "../data/mockProducts";

const categories = ["Tous", "Fruits & légumes", "Provisions", "Textiles"] as const;

export default function Browse() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Tous");

  const filtered = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchesCategory = category === "Tous" || p.category === category;
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

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
            placeholder="Rechercher un produit..."
            className="w-full pl-10 pr-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-full text-sm font-body whitespace-nowrap transition ${
                category === c
                  ? "bg-forest-800 text-cream"
                  : "bg-forest-300/30 text-forest-800 hover:bg-forest-300/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-forest-800/70 font-body text-center py-16">
          Aucun produit trouvé. Essayez une autre recherche.
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