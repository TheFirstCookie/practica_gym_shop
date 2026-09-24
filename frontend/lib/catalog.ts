export type Category = {
  name: string;
  slug: string;
  count: number;
  accent: string;
};

export type Brand = {
  name: string;
  slug: string;
};

export type Product = {
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  brand: string;
  brandSlug: string;
  price: number;
  stock: number;
  tag: string;
  image: string;
  description: string;
  specs: string[];
};

const categoryList: Omit<Category, "count">[] = [
  { name: "Strength", slug: "strength", accent: "#ff6247" },
  { name: "Conditioning", slug: "conditioning", accent: "#42c49f" },
  { name: "Recovery", slug: "recovery", accent: "#e3bb49" },
  { name: "Accessories", slug: "accessories", accent: "#7b91ff" }
];

// Placeholder brands until the real ones come from the backend.
export const brands: Brand[] = [
  { name: "Ironline", slug: "ironline" },
  { name: "Tempo Labs", slug: "tempo-labs" },
  { name: "Groundwork", slug: "groundwork" },
  { name: "Kinetic Supply", slug: "kinetic-supply" }
];

export const products: Product[] = [
  {
    name: "Ironclad Hex Dumbbell Set",
    slug: "ironclad-hex-dumbbell-set",
    category: "Strength",
    categorySlug: "strength",
    brand: "Ironline",
    brandSlug: "ironline",
    price: 229,
    stock: 12,
    tag: "Best seller",
    image:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80",
    description:
      "Rubber-coated hex dumbbells with knurled chrome grips for daily strength work at home or in a studio.",
    specs: ["5-30 kg pairs", "Knurled steel grip", "Low-bounce rubber heads"]
  },
  {
    name: "Tempo Sprint Bike",
    slug: "tempo-sprint-bike",
    category: "Conditioning",
    categorySlug: "conditioning",
    brand: "Tempo Labs",
    brandSlug: "tempo-labs",
    price: 649,
    stock: 5,
    tag: "Low stock",
    image:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
    description:
      "Compact air-resistance sprint bike with a stable frame, crisp monitor, and interval-ready controls.",
    specs: ["Air resistance", "Interval console", "150 kg max user weight"]
  },
  {
    name: "Competition Kettlebell",
    slug: "competition-kettlebell",
    category: "Strength",
    categorySlug: "strength",
    brand: "Kinetic Supply",
    brandSlug: "kinetic-supply",
    price: 86,
    stock: 24,
    tag: "New",
    image:
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=80",
    description:
      "Color-coded steel kettlebell with a consistent shell size across weights for cleaner technique.",
    specs: ["8-32 kg range", "Matte powder coat", "Flat machined base"]
  },
  {
    name: "GridLock Training Mat",
    slug: "gridlock-training-mat",
    category: "Accessories",
    categorySlug: "accessories",
    brand: "Groundwork",
    brandSlug: "groundwork",
    price: 58,
    stock: 31,
    tag: "Studio pick",
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80",
    description:
      "Dense training mat with guide marks for mobility, stretching, bodyweight work, and cooldowns.",
    specs: ["6 mm dense foam", "Anti-slip texture", "Alignment grid"]
  },
  {
    name: "Pulse Recovery Roller",
    slug: "pulse-recovery-roller",
    category: "Recovery",
    categorySlug: "recovery",
    brand: "Groundwork",
    brandSlug: "groundwork",
    price: 72,
    stock: 16,
    tag: "Recovery",
    image:
      "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&w=1200&q=80",
    description:
      "Firm textured roller for post-session recovery, travel warmups, and mobility maintenance.",
    specs: ["Textured EVA", "Hollow core", "Carry strap included"]
  },
  {
    name: "Wall Rack Pro",
    slug: "wall-rack-pro",
    category: "Accessories",
    categorySlug: "accessories",
    brand: "Ironline",
    brandSlug: "ironline",
    price: 134,
    stock: 8,
    tag: "Space saver",
    image:
      "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=80",
    description:
      "Powder-coated wall storage for bands, bars, straps, and jump ropes in compact training rooms.",
    specs: ["Steel wall plate", "8 storage points", "Hardware included"]
  }
];

// Counts come from the products so they can't drift out of sync.
export const categories: Category[] = categoryList.map((category) => ({
  ...category,
  count: products.filter((product) => product.categorySlug === category.slug).length
}));

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(price);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

// Same category first, topped up from the rest of the catalog so the row is never empty.
export function getRelatedProducts(product: Product, limit = 3) {
  const others = products.filter((item) => item.slug !== product.slug);

  return [
    ...others.filter((item) => item.categorySlug === product.categorySlug),
    ...others.filter((item) => item.categorySlug !== product.categorySlug)
  ].slice(0, limit);
}

export function getProductsByCategory(slug: string) {
  return products.filter((product) => product.categorySlug === slug);
}

// "featured" is the default order and isn't offered as a choice.
export const sortOptions = [
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" }
] as const;

export type SortOption = "featured" | (typeof sortOptions)[number]["value"];

export type ProductFilters = {
  brands: string[];
  sort: SortOption;
};

type SearchParams = Record<string, string | string[] | undefined>;

export function parseFilters(searchParams: SearchParams): ProductFilters {
  const brandParam = searchParams.brand ?? [];
  const requested = Array.isArray(brandParam) ? brandParam : [brandParam];
  const selected = brands
    .filter((brand) => requested.includes(brand.slug))
    .map((brand) => brand.slug);
  const sort =
    sortOptions.find((option) => option.value === searchParams.sort)?.value ?? "featured";

  return { brands: selected, sort };
}

export function hasActiveFilters(filters: ProductFilters) {
  return filters.brands.length > 0 || filters.sort !== "featured";
}

export function applyFilters(items: Product[], filters: ProductFilters) {
  const filtered =
    filters.brands.length > 0
      ? items.filter((product) => filters.brands.includes(product.brandSlug))
      : items;

  if (filters.sort === "price-asc") {
    return [...filtered].sort((a, b) => a.price - b.price);
  }

  if (filters.sort === "price-desc") {
    return [...filtered].sort((a, b) => b.price - a.price);
  }

  return filtered;
}

export const MAX_QUERY_LENGTH = 80;

export function parseQuery(searchParams: SearchParams) {
  const param = searchParams.q;
  const value = Array.isArray(param) ? param[0] : param;
  return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

// Lowercase, drop accents and turn punctuation into spaces, padded so a
// word start can be found with `includes(" " + term)`.
function normalize(text: string) {
  const plain = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return ` ${plain} `;
}

// Crude plural handling so "kettlebells" still finds "kettlebell".
function stem(term: string) {
  return term.length > 3 && term.endsWith("s") && !term.endsWith("ss") ? term.slice(0, -1) : term;
}

function scoreProduct(product: Product, terms: string[]) {
  const fields = [
    { text: normalize(product.name), weight: 4 },
    { text: normalize(`${product.brand} ${product.category} ${product.tag}`), weight: 2 },
    { text: normalize(`${product.description} ${product.specs.join(" ")}`), weight: 1 }
  ];
  let score = 0;

  for (const term of terms) {
    // A hit at the start of a word ("dumb" in "dumbbell") counts double one inside it ("bell").
    const best = Math.max(
      ...fields.map(({ text, weight }) => {
        if (text.includes(` ${term}`)) return weight;
        if (text.includes(term)) return weight / 2;
        return 0;
      })
    );

    if (best === 0) {
      return 0;
    }

    score += best;
  }

  return score;
}

// Every word in the query has to match somewhere; name hits rank highest.
// Ties keep catalog order, since sort is stable.
export function searchProducts(items: Product[], query: string) {
  const terms = normalize(query).split(" ").filter(Boolean).map(stem);

  if (terms.length === 0) {
    return [];
  }

  return items
    .map((product) => ({ product, score: scoreProduct(product, terms) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.product);
}

// Brands present in a product list, with counts, for the filter chips.
// Selected brands stay listed so they can still be switched off.
export function getBrandFacets(items: Product[], selected: string[]) {
  return brands
    .map((brand) => ({
      ...brand,
      count: items.filter((product) => product.brandSlug === brand.slug).length
    }))
    .filter((brand) => brand.count > 0 || selected.includes(brand.slug));
}
