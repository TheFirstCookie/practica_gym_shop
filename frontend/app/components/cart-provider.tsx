"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProduct } from "@/lib/catalog";

// Only slugs and quantities are stored. Prices and stock are always looked up
// from the catalog, so a stale cart can't carry an old price into checkout.
export type CartLine = {
  slug: string;
  quantity: number;
};

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

const storageKey = "forgefit-cart";

const CartContext = createContext<CartContextValue | null>(null);

// Drops unknown products and duplicates, and keeps each quantity between 1 and the stock on hand.
function sanitize(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) {
    return [];
  }

  const result: CartLine[] = [];

  for (const line of lines as Partial<CartLine>[]) {
    const product = typeof line?.slug === "string" ? getProduct(line.slug) : undefined;

    if (!product || result.some((item) => item.slug === product.slug)) {
      continue;
    }

    const quantity = Math.min(Math.floor(Number(line.quantity)), product.stock);

    if (quantity >= 1) {
      result.push({ slug: product.slug, quantity });
    }
  }

  return result;
}

function readStoredCart() {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]"));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readStoredCart());
    setReady(true);

    // Keep other open tabs in sync.
    function handleStorage(event: StorageEvent) {
      if (event.key === storageKey) {
        setLines(readStoredCart());
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // Storage can be blocked (private mode); the cart still works for this visit.
    }
  }, [lines, ready]);

  const add = useCallback((slug: string, quantity = 1) => {
    setLines((current) =>
      sanitize(
        current.some((line) => line.slug === slug)
          ? current.map((line) =>
              line.slug === slug ? { ...line, quantity: line.quantity + quantity } : line
            )
          : [...current, { slug, quantity }]
      )
    );
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((current) =>
      sanitize(current.map((line) => (line.slug === slug ? { ...line, quantity } : line)))
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((current) => current.filter((line) => line.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

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
