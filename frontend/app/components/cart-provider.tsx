"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  isSameLine,
  subscribeToCart,
  updateCart,
  type CartLine,
  type CartLineRef
} from "@/lib/cart-store";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  // False until the saved cart has been read, so nothing flashes "empty" on load.
  ready: boolean;
  /** How many of this product (or variant) are in the cart. */
  quantityOf: (line: CartLineRef) => number;
  /** `stock` caps the line total when the caller knows it (product page). */
  add: (line: CartLineRef, quantity?: number, stock?: number) => void;
  setQuantity: (line: CartLineRef, quantity: number) => void;
  remove: (line: CartLineRef) => void;
  clear: () => void;
};

const emptyCart: CartLine[] = [];

const CartContext = createContext<CartContextValue | null>(null);

/** Just the identifying fields, without an `undefined` variant key in storage. */
function toRef({ slug, variant }: CartLineRef): CartLineRef {
  return variant ? { slug, variant } : { slug };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
  const ready = stored !== null;
  const lines = stored ?? emptyCart;

  const quantityOf = useCallback(
    (target: CartLineRef) => lines.find((line) => isSameLine(line, target))?.quantity ?? 0,
    [lines]
  );

  const add = useCallback((target: CartLineRef, quantity = 1, stock = Infinity) => {
    updateCart((current) =>
      current.some((line) => isSameLine(line, target))
        ? current.map((line) =>
            isSameLine(line, target) ? { ...line, quantity: Math.min(line.quantity + quantity, stock) } : line
          )
        : [...current, { ...toRef(target), quantity: Math.min(quantity, stock) }]
    );
  }, []);

  const setQuantity = useCallback((target: CartLineRef, quantity: number) => {
    updateCart((current) => current.map((line) => (isSameLine(line, target) ? { ...line, quantity } : line)));
  }, []);

  const remove = useCallback((target: CartLineRef) => {
    updateCart((current) => current.filter((line) => !isSameLine(line, target)));
  }, []);

  const clear = useCallback(() => updateCart(() => []), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      ready,
      quantityOf,
      add,
      setQuantity,
      remove,
      clear
    }),
    [lines, ready, quantityOf, add, setQuantity, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error("useCart must be used inside <CartProvider>");
  }

  return cart;
}
