"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { Product } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart-provider";
import { ProductImage } from "./product-image";
import { useCartProducts } from "./use-cart-products";

type CartItem = {
  slug: string;
  quantity: number;
  /** undefined while loading, null when the product was removed from the shop. */
  product: Product | null | undefined;
};

export function CartView() {
  const { lines, count, ready, setQuantity, remove } = useCart();
  const { products, loading, failed, retry } = useCartProducts(lines.map((line) => line.slug));
  const [showCheckoutNote, setShowCheckoutNote] = useState(false);

  const items: CartItem[] = lines.map((line) => ({ ...line, product: products[line.slug] }));
  const purchasable = items.filter(
    (item): item is CartItem & { product: Product } => Boolean(item.product && item.product.stock > 0)
  );
  const subtotal = purchasable.reduce(
    (total, item) => total + item.product.priceCents * item.quantity,
    0
  );
  const currency = purchasable[0]?.product.currency ?? "usd";

  // Stock may have dropped since the item was added: trim the saved quantity to what's left.
  useEffect(() => {
    for (const line of lines) {
      const product = products[line.slug];
      if (product && product.stock > 0 && line.quantity > product.stock) {
        setQuantity(line.slug, product.stock);
      }
    }
  }, [lines, products, setQuantity]);

  if (!ready) {
    return (
      <section className="cart-layout" aria-busy="true">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Your cart</h1>
        </div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="empty-page">
        <p className="eyebrow">Cart</p>
        <h1>Your cart is empty</h1>
        <p>Nothing here yet. Find something that earns its floor space.</p>
        <Link href="/#catalog" className="button primary">
          <span>Shop equipment</span>
          <ArrowRight size={18} />
        </Link>
      </section>
    );
  }

  return (
    <section className="cart-layout">
      <div>
        <p className="eyebrow">
          {count} {count === 1 ? "item" : "items"}
        </p>
        <h1>Your cart</h1>

        {failed && (
          <div className="inline-alert" role="alert">
            <p>Some prices couldn&apos;t be loaded. The shop may be waking up.</p>
            <button type="button" className="button secondary" onClick={retry}>
              <RotateCcw size={16} />
              <span>Try again</span>
            </button>
          </div>
        )}

        <div className="cart-list" aria-busy={loading}>
          {items.map((item) => (
            <CartRow
              key={item.slug}
              item={item}
              onQuantity={(quantity) => setQuantity(item.slug, quantity)}
              onRemove={() => remove(item.slug)}
            />
          ))}
        </div>
      </div>

      <aside className="summary-panel">
        <span>Subtotal</span>
        <strong>{loading ? "…" : formatPrice(subtotal, currency)}</strong>
        <p>Taxes and shipping are calculated during Stripe checkout.</p>
        <button
          type="button"
          className="button primary"
          disabled={loading || purchasable.length === 0}
          onClick={() => setShowCheckoutNote(true)}
        >
          <CreditCard size={18} />
          <span>Checkout</span>
        </button>
        {showCheckoutNote && (
          // Replace with the Stripe session redirect once checkout exists.
          <p className="checkout-note" role="status">
            Checkout connects to Stripe in the next step of the project. Your cart is saved until then.
          </p>
        )}
      </aside>
    </section>
  );
}

type CartRowProps = {
  item: CartItem;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
};

function CartRow({ item, onQuantity, onRemove }: CartRowProps) {
  const { product, quantity, slug } = item;

  if (product === undefined) {
    return <article className="cart-item cart-item-loading" aria-label="Loading item" />;
  }

  if (product === null) {
    return (
      <article className="cart-item cart-item-unavailable">
        <span className="cart-item-image">
          <ProductImage src={null} alt="" />
        </span>
        <div>
          <h2>No longer available</h2>
          <span className="cart-unit">This product was removed from the shop.</span>
        </div>
        <div className="quantity-tools">
          <button type="button" aria-label={`Remove unavailable item ${slug}`} onClick={onRemove}>
            <Trash2 size={16} />
          </button>
        </div>
      </article>
    );
  }

  const soldOut = product.stock === 0;
  const price = (cents: number) => formatPrice(cents, product.currency);

  return (
    <article className="cart-item">
      <Link href={`/product/${product.slug}`} className="cart-item-image" tabIndex={-1}>
        <ProductImage src={product.image} alt="" />
      </Link>
      <div>
        <small>{product.brand.name}</small>
        <h2>
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h2>
        {soldOut ? (
          <strong className="out-of-stock">Sold out</strong>
        ) : (
          <>
            <strong>{price(product.priceCents * quantity)}</strong>
            {quantity > 1 && <span className="cart-unit">{price(product.priceCents)} each</span>}
          </>
        )}
      </div>
      <div className="quantity-tools">
        {!soldOut && (
          <>
            <button
              type="button"
              aria-label={`Decrease ${product.name} quantity`}
              disabled={quantity <= 1}
              onClick={() => onQuantity(quantity - 1)}
            >
              <Minus size={16} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label={`Increase ${product.name} quantity`}
              title={quantity >= product.stock ? `Only ${product.stock} in stock` : undefined}
              disabled={quantity >= product.stock}
              onClick={() => onQuantity(quantity + 1)}
            >
              <Plus size={16} />
            </button>
          </>
        )}
        <button type="button" aria-label={`Remove ${product.name}`} onClick={onRemove}>
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
