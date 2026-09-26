import type { CartLineRef } from "./cart-store";
import type { Product } from "./api/types";

/** What a cart line buys today: the product itself, or the chosen variant of it. */
export type LinePurchase = {
  /** "20 kg"; null for a product without variants. */
  variantName: string | null;
  priceCents: number;
  stock: number;
};

/**
 * Prices a saved cart line against the product as it is now. Null when it can't be bought
 * as saved: the chosen variant was removed or hidden, or the product gained variants
 * since (then the shopper has to pick one), or lost them.
 */
export function resolveLine(product: Product, line: CartLineRef): LinePurchase | null {
  if (!line.variant) {
    return product.hasVariants ? null : { variantName: null, priceCents: product.priceCents, stock: product.stock };
  }

  const variant = product.variants.find((option) => option.id === line.variant);
  return variant ? { variantName: variant.name, priceCents: variant.priceCents, stock: variant.stock } : null;
}

/** One line of text for a cart line or order item: "Bumper Plate (20 kg)". */
export function itemLabel(name: string, variantName: string | null | undefined) {
  return variantName ? `${name} (${variantName})` : name;
}
