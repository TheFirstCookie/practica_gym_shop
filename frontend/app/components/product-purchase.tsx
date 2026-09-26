"use client";

import { useState } from "react";
import type { Product } from "@/lib/api/types";
import { itemLabel } from "@/lib/cart-lines";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "./add-to-cart";

type ProductPurchaseProps = {
  product: Product;
  /** More buttons beside "Add to cart" (the wishlist heart). */
  children?: React.ReactNode;
};

/** The first option that can be bought, so the page opens on something in stock. */
function initialVariant(product: Product) {
  return (product.variants.find((variant) => variant.stock > 0) ?? product.variants[0])?.id ?? null;
}

/**
 * Price, stock and "Add to cart" on the product page. Products sold in weights, sizes or
 * colours get a picker first, and the price and stock follow the chosen option.
 */
export function ProductPurchase({ product, children }: ProductPurchaseProps) {
  const [variantId, setVariantId] = useState(() => initialVariant(product));
  const variant = product.variants.find((option) => option.id === variantId) ?? null;

  // A product with variants but none on sale (all hidden): nothing to pick, nothing to buy.
  const stock = product.hasVariants ? (variant?.stock ?? 0) : product.stock;
  const priceCents = variant?.priceCents ?? product.priceCents;
  const pricesDiffer = product.variants.some((option) => option.priceCents !== product.variants[0]?.priceCents);
  const price = (cents: number) => formatPrice(cents, product.currency);

  return (
    <>
      <div className="price-row">
        <strong>{price(priceCents)}</strong>
        <span className={stock === 0 ? "out-of-stock" : undefined} aria-live="polite">
          {stock > 0 ? `${stock} in stock` : "Sold out"}
        </span>
      </div>

      {product.variants.length > 0 && (
        <fieldset className="variant-picker">
          <legend>
            Option: <b>{variant?.name}</b>
          </legend>
          <div className="variant-options">
            {product.variants.map((option) => (
              <label key={option.id} className="variant-option" data-sold-out={option.stock === 0 ? "" : undefined}>
                <input
                  type="radio"
                  name={`variant-${product.id}`}
                  value={option.id}
                  checked={option.id === variantId}
                  onChange={() => setVariantId(option.id)}
                />
                <span>{option.name}</span>
                {pricesDiffer && <small>{price(option.priceCents)}</small>}
                {option.stock === 0 && <small className="visually-hidden">(sold out)</small>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <AddToCart
        // A fresh quantity picker for each option.
        key={variant?.id ?? "product"}
        line={variant ? { slug: product.slug, variant: variant.id } : { slug: product.slug }}
        name={itemLabel(product.name, variant?.name)}
        stock={stock}
      >
        {children}
      </AddToCart>
    </>
  );
}
