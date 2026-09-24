"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice, getProduct, type Product } from "@/lib/catalog";
import { useCart } from "./cart-provider";

type CartItem = {
  product: Product;
  quantity: number;
};

export function CartView() {
  const { lines, count, ready, setQuantity, remove } = useCart();
  const [showCheckoutNote, setShowCheckoutNote] = useState(false);

  const items = lines.flatMap((line): CartItem[] => {
    const product = getProduct(line.slug);
    return product ? [{ product, quantity: line.quantity }] : [];
  });
  const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

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

  if (items.length === 0) {
    return (
      <section className="cart-empty">
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
        <div className="cart-list">
          {items.map(({ product, quantity }) => (
            <article className="cart-item" key={product.slug}>
              <Link href={`/product/${product.slug}`} className="cart-item-image" tabIndex={-1}>
                <img src={product.image} alt="" />
              </Link>
              <div>
                <small>{product.brand}</small>
                <h2>
                  <Link href={`/product/${product.slug}`}>{product.name}</Link>
                </h2>
                <strong>{formatPrice(product.price * quantity)}</strong>
                {quantity > 1 && (
                  <span className="cart-unit">{formatPrice(product.price)} each</span>
                )}
              </div>
              <div className="quantity-tools">
                <button
                  type="button"
                  aria-label={`Decrease ${product.name} quantity`}
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(product.slug, quantity - 1)}
                >
                  <Minus size={16} />
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label={`Increase ${product.name} quantity`}
                  title={quantity >= product.stock ? `Only ${product.stock} in stock` : undefined}
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity(product.slug, quantity + 1)}
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${product.name}`}
                  onClick={() => remove(product.slug)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="summary-panel">
        <span>Subtotal</span>
        <strong>{formatPrice(subtotal)}</strong>
        <p>Taxes and shipping are calculated during Stripe checkout.</p>
        <button
          type="button"
          className="button primary"
          onClick={() => setShowCheckoutNote(true)}
        >
          <CreditCard size={18} />
          <span>Checkout</span>
        </button>
        {showCheckoutNote && (
          // Replace with the Stripe session redirect once the backend exists.
          <p className="checkout-note" role="status">
            Checkout connects to Stripe once the backend is live. Your cart is saved until then.
          </p>
        )}
      </aside>
    </section>
  );
}
