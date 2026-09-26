import type { Product } from "@/lib/api/types";

/** A plate sold in three weights: 10 kg and 20 kg on sale, 25 kg sold out. */
export const bumperPlate: Product = {
  id: "p-plate",
  name: "Bumper Plate",
  slug: "bumper-plate",
  priceCents: 4900,
  priceMaxCents: 10900,
  hasVariants: true,
  currency: "usd",
  stock: 8,
  tag: null,
  image: null,
  category: { id: "c1", name: "Strength", slug: "strength" },
  brand: { id: "b1", name: "Ironline", slug: "ironline" },
  description: "",
  specs: [],
  variants: [
    { id: "v-10", name: "10 kg", priceCents: 4900, stock: 5 },
    { id: "v-20", name: "20 kg", priceCents: 8900, stock: 3 },
    { id: "v-25", name: "25 kg", priceCents: 10900, stock: 0 }
  ]
};

export const yogaMat: Product = {
  ...bumperPlate,
  id: "p-mat",
  name: "Yoga Mat",
  slug: "yoga-mat",
  priceCents: 2900,
  priceMaxCents: 2900,
  hasVariants: false,
  stock: 4,
  variants: []
};
