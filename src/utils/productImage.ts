// Picks a relevant illustrative photo for a product when it has no usable image
// of its own. Matches the product name against food/textile keywords (French +
// English) so a plantain shows plantains, rice shows rice, a pagne shows fabric,
// etc.; unknown items fall to a category-appropriate pool, spread by a name/id
// hash so cards don't all repeat. Images are real Douala-market photography,
// bundled locally (Vite fingerprints them) — no runtime dependency on a CDN.

import plantainsBunch from "../assets/home/fallback-produce.jpg";
import plantainsStall from "../assets/home/promo-plantains.jpg";
import plantainsFloor from "../assets/home/plantains-2.jpg";
import vegMarket from "../assets/home/category-produce.jpg";
import fish from "../assets/home/promo-fish.jpg";
import riceSacks from "../assets/home/category-groceries.jpg";
import riceBrand from "../assets/home/promo-rice.jpg";
import fabricRolls from "../assets/home/fabric-rolls.jpg";
import fabricShop from "../assets/home/category-textiles.jpg";
import fabricAlley from "../assets/home/hero-market-fabrics.jpg";

// name keyword -> image. Order matters (first match wins); keep specific first.
const KEYWORDS: [RegExp, string][] = [
  [/plantain|banane|banana/i, plantainsBunch],
  [/riz|rice/i, riceSacks],
  [/tomate|tomato|piment|pepper|oignon|onion|l(e|é)gume|vegetable/i, vegMarket],
  [/poisson|fish|maquereau|bar\b/i, fish],
  [/tissu|pagne|textile|fabric|wax|kaba|ndop|robe|couture/i, fabricRolls],
];

// category value -> pool of fitting photos (spread by hash).
const POOLS: Record<string, string[]> = {
  produce: [vegMarket, plantainsBunch, plantainsStall, plantainsFloor],
  groceries: [riceSacks, riceBrand],
  textiles: [fabricRolls, fabricShop, fabricAlley],
};

const GENERIC = POOLS.produce;

const CATEGORY_KEY: Record<string, string> = {
  "Fruits & légumes": "produce",
  "Provisions": "groceries",
  "Textiles": "textiles",
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Best illustrative image for a product with no usable photo of its own. */
export function productImage(name: string, category?: string, seed?: string): string {
  for (const [re, url] of KEYWORDS) if (re.test(name)) return url;
  const pool = POOLS[CATEGORY_KEY[category ?? ""] ?? ""] ?? GENERIC;
  return pool[hash(seed || name) % pool.length];
}

/** True when a stored photoUrl is worth trying before the illustrative fallback. */
export function hasUsablePhoto(url?: string | null): boolean {
  if (!url) return false;
  if (/cdn\.sellam\.test/i.test(url)) return false; // known placeholder host
  // Seed/demo data uses Unsplash stock URLs (often mismatched — e.g. a suit for
  // a "pagne"); prefer our local, on-brand illustration over those. Genuine
  // seller uploads live on other hosts and still take precedence.
  if (/unsplash\.com/i.test(url)) return false;
  return /^https?:\/\//i.test(url);
}
