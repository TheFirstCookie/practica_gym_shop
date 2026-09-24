"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartLink() {
  const { count, ready } = useCart();
  const showCount = ready && count > 0;

  return (
    <Link
      href="/cart"
      className="cart-pill"
      aria-label={showCount ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
    >
      <ShoppingBag size={17} />
      <span>Cart</span>
      {showCount && (
        // Keyed on the count so the bump animation replays on every change.
        <span className="cart-count" key={count} aria-hidden="true">
          {count}
        </span>
      )}
    </Link>
  );
}
