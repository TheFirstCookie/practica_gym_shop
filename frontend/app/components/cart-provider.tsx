"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  subscribeToCart,
  updateCart,
  type CartLine
} from "@/lib/cart-store";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  // False until the saved cart has been read, so nothing flashes "empty" on load.
  ready: boolean;
  add: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const emptyCart: CartLine[] = [];

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
  const ready = stored !== null;
  const lines = stored ?? emptyCart;

  const add = useCallback((slug: string, quantity = 1) => {
    updateCart((current) =>
      current.some((line) => line.slug === slug)
        ? current.map((line) =>
            line.slug === slug ? { ...line, quantity: line.quantity + quantity } : line
          )
        : [...current, { slug, quantity }]
    );
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    updateCart((current) =>
      current.map((line) => (line.slug === slug ? { ...line, quantity } : line))
    );
  }, []);

  const remove = useCallback((slug: string) => {
    updateCart((current) => current.filter((line) => line.slug !== slug));
  }, []);

  const clear = useCallback(() => updateCart(() => []), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      ready,
      add,
      setQuantity,
      remove,
      clear
    }),
    [lines, ready, add, setQuantity, remove, clear]
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
