"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addToWishlist, getWishlist, removeFromWishlist } from "@/lib/api/account";
import { useCustomerSession } from "./customer-session";

type WishlistContextValue = {
  /** False until the signed-in shopper's list has loaded (always false when signed out). */
  ready: boolean;
  has: (slug: string) => boolean;
  /**
   * Adds or removes a product. Updates the hearts at once and undoes that if the API
   * refuses. Resolves to an error message, or null. Needs a signed-in shopper.
   */
  toggle: (slug: string) => Promise<string | null>;
};

type Loaded = { userId: string; slugs: ReadonlySet<string> };

const WishlistContext = createContext<WishlistContextValue | null>(null);

/** Which products the signed-in shopper saved, so every heart on the page agrees. */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { customer, getToken } = useCustomerSession();
  const userId = customer?.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    getToken()
      .then((token) => (token ? getWishlist(token, controller.signal) : []))
      .then((items) => setLoaded({ userId, slugs: new Set(items.map((item) => item.slug)) }))
      // The hearts just stay empty; the wishlist page shows the real error.
      .catch(() => !controller.signal.aborted && setLoaded({ userId, slugs: new Set() }));
    return () => controller.abort();
  }, [userId, getToken]);

  // Anything loaded for a previous account doesn't count.
  const slugs = loaded && loaded.userId === userId ? loaded.slugs : null;

  const toggle = useCallback(
    async (slug: string) => {
      const token = await getToken();
      if (!token || !userId) return "Sign in to save products.";

      const adding = !slugs?.has(slug);
      const apply = (add: boolean) =>
        setLoaded((current) => {
          if (!current || current.userId !== userId) return current;
          const next = new Set(current.slugs);
          if (add) next.add(slug);
          else next.delete(slug);
          return { userId, slugs: next };
        });

      apply(adding);
      try {
        await (adding ? addToWishlist(token, slug) : removeFromWishlist(token, slug));
        return null;
      } catch (error) {
        apply(!adding);
        return error instanceof Error ? error.message : "Couldn't update your wishlist.";
      }
    },
    [getToken, userId, slugs]
  );

  const value = useMemo(
    () => ({
      ready: slugs !== null,
      has: (slug: string) => slugs?.has(slug) ?? false,
      toggle
    }),
    [slugs, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return value;
}
