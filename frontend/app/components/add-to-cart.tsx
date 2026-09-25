"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

type AddToCartProps = {
  slug: string;
  name: string;
  stock: number;
  /** More buttons for the same row (the wishlist heart). */
  children?: React.ReactNode;
};

export function AddToCart({ slug, name, stock, children }: AddToCartProps) {
  const { lines, add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const inCart = lines.find((line) => line.slug === slug)?.quantity ?? 0;
  const available = Math.max(stock - inCart, 0);
  const chosen = Math.min(quantity, Math.max(available, 1));

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timeout = window.setTimeout(() => setJustAdded(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [justAdded]);

  function handleAdd() {
    add(slug, chosen, stock);
    setQuantity(1);
    setJustAdded(true);
  }

  let label = "Add to cart";
  if (stock === 0) {
    label = "Sold out";
  } else if (justAdded) {
    label = "Added";
  } else if (available === 0) {
    label = "All stock in cart";
  }

  return (
    <>
      <div className="detail-actions">
        {available > 0 && (
          <div className="quantity-tools" role="group" aria-label="Quantity">
            <button
              type="button"
              aria-label={`Decrease ${name} quantity`}
              disabled={chosen <= 1}
              onClick={() => setQuantity(chosen - 1)}
            >
              <Minus size={16} />
            </button>
            <span aria-live="polite">{chosen}</span>
            <button
              type="button"
              aria-label={`Increase ${name} quantity`}
              disabled={chosen >= available}
              onClick={() => setQuantity(chosen + 1)}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
        <button
          type="button"
          className={justAdded ? "button primary is-added" : "button primary"}
          disabled={available === 0 && !justAdded}
          onClick={handleAdd}
        >
          {justAdded ? <Check size={18} strokeWidth={2.8} /> : <ShoppingBag size={18} />}
          <span>{label}</span>
        </button>
        {children}
      </div>
      {inCart > 0 && (
        <p className="cart-note">
          {inCart} in your cart. <Link href="/cart">View cart</Link>
        </p>
      )}
    </>
  );
}
