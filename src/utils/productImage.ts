// Picks a relevant illustrative photo for a product when it has no usable image
// of its own. Matches the product name against food keywords (French + English)
// so a plantain shows plantains, honey shows honey, etc.; unknown items fall to
// a category-appropriate pool, spread by a name/id hash so cards don't repeat.

const q = "?w=600&q=80&auto=format&fit=crop";
const U = (id: string) => `https://images.unsplash.com/photo-${id}${q}`;

// name keyword -> image. Order matters (first match wins); keep specific first.
const KEYWORDS: [RegExp, string][] = [
  [/plantain|banane|banana/i, U("1603052875302-d376b7c0638a")], // plantains
  [/miel|honey/i, U("1587049352846-4a222e784d38")], // honey jar
  [/riz|rice/i, U("1586201375761-83865001e31c")], // rice sack
  [/ma(i|ï)s|corn|\bmaize\b/i, U("1551754655-cd27e38d2076")], // corn
  [/tomate|tomato/i, U("1592924357228-91a4daadcfea")], // tomatoes
  [/piment|pepper|chili|chilli/i, U("1583119912267-cc97c911e416")], // chili peppers
  [/oignon|onion/i, U("1518977676601-b53f82aba655")], // onions
  [/poisson|fish/i, U("1519708227418-c8fd9a32b7a2")], // fish
  [/poulet|chicken|volaille/i, U("1587593810167-a84920ea0781")], // chicken
  [/viande|meat|b(oe|œ)uf|beef/i, U("1603048297172-c92544798d5a")], // meat
  [/huile|\boil\b/i, U("1474979266404-7eaacbcd87c5")], // oil
  [/farine|flour/i, U("1509440159596-0249088772ff")], // flour
  [/sucre|sugar/i, U("1581441363689-1f3c3c414635")], // sugar
  [/lait|milk/i, U("1550583724-b2692b85b150")], // milk
  [/(oe|œ)uf|\begg/i, U("1582722872445-44dc5f7e3c8f")], // eggs
  [/manioc|cassava|attieke|attiéké/i, U("1518977956812-cd3dbadaaf31")], // tubers
  [/igname|yam|patate|potato/i, U("1518977956812-cd3dbadaaf31")],
  [/mangue|mango/i, U("1605027990121-cbae9e0642df")], // mango
  [/ananas|pineapple/i, U("1550258987-190a2d41a8ba")], // pineapple
  [/avocat|avocado/i, U("1523049673857-eb18f1d7b578")], // avocado
  [/arachide|peanut|cacahu/i, U("1567892737950-30c4db37cd89")], // peanuts
  [/haricot|bean|l(e|é)gumineuse/i, U("1515543237350-b3eea1ec8082")], // beans
  [/caf(e|é)|coffee/i, U("1447933601403-0c6688de566e")], // coffee
  [/th(e|é)\b|\btea\b/i, U("1576092768241-dec231879fc3")], // tea
  [/tissu|pagne|textile|fabric|wax/i, U("1596462502278-27bfdc403348")], // fabric
  [/savon|soap/i, U("1584305574647-0cc949a2bb9f")], // soap
  [/épice|epice|spice/i, U("1596040033229-a9821ebd058d")], // spices
];

// category value -> pool of generic-but-fitting photos (spread by hash).
const POOLS: Record<string, string[]> = {
  produce: [
    U("1540420773420-3366772f4999"), // veg basket
    U("1610832958506-aa56368176cf"), // market fruit
    U("1518843875459-f738682238a6"), // greens
    U("1567306226416-28f0efdc88ce"), // fresh produce
  ],
  groceries: [
    U("1586201375761-83865001e31c"), // rice
    U("1604719312566-8912e9227c6a"), // pantry
    U("1553546895-531931aa1aa8"), // groceries
    U("1542838132-92c53300491e"), // market goods
  ],
  textiles: [
    U("1596462502278-27bfdc403348"), // fabric
    U("1594633312681-425c7b97ccd1"), // african textile
    U("1441984904996-e0b6ba687e04"), // fashion
  ],
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
  return /^https?:\/\//i.test(url);
}
