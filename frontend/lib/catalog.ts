export type Category = {
  name: string;
  slug: string;
  count: number;
  accent: string;
};

export type Product = {
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  stock: number;
  tag: string;
  image: string;
  description: string;
  specs: string[];
};

export const categories: Category[] = [
  { name: "Strength", slug: "strength", count: 18, accent: "#f04d32" },
  { name: "Conditioning", slug: "conditioning", count: 14, accent: "#0f9d7a" },
  { name: "Recovery", slug: "recovery", count: 9, accent: "#d0aa3b" },
  { name: "Accessories", slug: "accessories", count: 22, accent: "#4967db" }
];

export const products: Product[] = [
  {
    name: "Ironclad Hex Dumbbell Set",
    slug: "ironclad-hex-dumbbell-set",
    category: "Strength",
    categorySlug: "strength",
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

export function getProductsByCategory(slug: string) {
  return products.filter((product) => product.categorySlug === slug);
}
