import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Product, BulkPriceTier } from "../types/product";

export interface SellerListing extends Product {
  active: boolean;
}

interface SellerContextValue {
  listings: SellerListing[];
  addListing: (listing: Omit<SellerListing, "id">) => void;
  updateListing: (id: string, listing: Omit<SellerListing, "id">) => void;
  toggleActive: (id: string) => void;
  deleteListing: (id: string) => void;
}

const SellerContext = createContext<SellerContextValue | undefined>(undefined);

// TODO (backend): replace seed data with GET /sellers/me/products once auth + API exist
const seedListings: SellerListing[] = [
  {
    id: "s1",
    name: "Plantains mûrs",
    category: "Fruits & légumes",
    unit: "bassine",
    price: 3500,
    bulkPriceTiers: [{ minQuantity: 5, price: 3200 }],
    quantityAvailable: 12,
    qualityGrade: "A",
    photoUrl: "https://images.unsplash.com/photo-1603833665858-e61a9b3d3a99?w=400",
    description: "Plantains mûrs, récoltés cette semaine.",
    sellerName: "Mama Ngozi",
    sellerVerified: true,
    sellerTrustScore: 4.6,
    market: "Marché Central",
    active: true,
  },
];

export function SellerProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<SellerListing[]>(seedListings);

  const addListing = (listing: Omit<SellerListing, "id">) => {
    const newListing: SellerListing = { ...listing, id: crypto.randomUUID() };
    setListings((prev) => [newListing, ...prev]);
    // TODO (backend): POST /products with listing payload, per FR-4
  };

  const updateListing = (id: string, listing: Omit<SellerListing, "id">) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...listing, id } : l)));
    // TODO (backend): PATCH /products/:id
  };

  const toggleActive = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l))
    );
    // TODO (backend): PATCH /products/:id { active }
  };

  const deleteListing = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    // TODO (backend): DELETE /products/:id
  };

  return (
    <SellerContext.Provider
      value={{ listings, addListing, updateListing, toggleActive, deleteListing }}
    >
      {children}
    </SellerContext.Provider>
  );
}

export function useSeller() {
  const ctx = useContext(SellerContext);
  if (!ctx) throw new Error("useSeller must be used within a SellerProvider");
  return ctx;
}

export type { BulkPriceTier };