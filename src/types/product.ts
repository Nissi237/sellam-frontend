export interface BulkPriceTier {
  minQuantity: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: "Fruits & légumes" | "Provisions" | "Textiles";
  unit: "kg" | "bassine" | "sac" | "pièce" | "carton";
  price: number; // in FCFA
  bulkPriceTiers?: BulkPriceTier[]; // per FR-5
  quantityAvailable: number;
  qualityGrade?: "A" | "B" | "C";
  photoUrl: string;
  description: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerTrustScore?: number; // 0-5, per FR-19
  averageRating?: number; // per FR-18
  reviewCount?: number;
  market: string;
}