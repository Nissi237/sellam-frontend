export interface Product {
  id: string;
  name: string;
  category: "Fruits & légumes" | "Provisions" | "Textiles";
  unit: "kg" | "bassine" | "sac" | "pièce" | "carton";
  price: number; // in FCFA
  quantityAvailable: number;
  qualityGrade?: "A" | "B" | "C";
  photoUrl: string;
  sellerName: string;
  sellerVerified: boolean;
  market: string;
}