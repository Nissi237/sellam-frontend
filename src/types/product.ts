export interface BulkPriceTier {
  minQuantity: number;
  price: number;
}

export interface Product {
  id: string;
  sellerId?: string;
  name: string;
  // Category/unit are free-form strings from the backend (French labels used in
  // this pilot), not a fixed enum.
  category: string;
  unit: string;
  price: number; // in FCFA
  promoPrice?: number | null; // active promotion price, per FR-20
  effectivePrice?: number; // promoPrice ?? price
  sponsored?: boolean; // per FR-30
  bulkPriceTiers?: BulkPriceTier[]; // per FR-5
  quantityAvailable: number;
  qualityGrade?: "A" | "B" | "C" | null; // per FR-28
  photoUrl: string;
  videoUrl?: string | null;
  ownershipProofUrl?: string | null;
  needsOwnershipProof?: boolean; // duplicate image, awaiting proof of ownership
  description: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerTrustScore?: number | null; // 0-5, per FR-19
  averageRating?: number | null; // per FR-18
  reviewCount?: number;
  market: string;
  harvestDate?: string | null;
  isActive?: boolean;
  originStatus?: "none" | "pending" | "verified" | "unverified";
  originClaim?: string | null; // shown only when Admin-verified (FR-41/42)
  imageFlagged?: boolean; // FR-43
}
