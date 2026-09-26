"use client";

import { useEffect, useState } from "react";
import { getProduct } from "@/lib/api/catalog";
import type { Product } from "@/lib/api/types";

/** Per-slug lookup state: a product, `null` when it no longer exists, or missing while loading. */
type ProductsBySlug = Record<string, Product | null>;

export type CartProducts = {
  products: ProductsBySlug;
  loading: boolean;
  failed: boolean;
  retry: () => void;
};

/**
 * Fetches current details (price, stock, photo, variants) for every product in the cart.
 * Only slugs not fetched yet are requested, so changing a quantity doesn't refetch anything.
 * Pass each slug once, even when several variants of it are in the cart.
 */
export function useCartProducts(slugs: string[]): CartProducts {
  const [products, setProducts] = useState<ProductsBySlug>({});
  const [failedSlugs, setFailedSlugs] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);

  const missing = slugs.filter((slug) => !(slug in products));
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!missingKey) {
      return;
    }

    const controller = new AbortController();
    const toFetch = missingKey.split(",");

    Promise.allSettled(toFetch.map((slug) => getProduct(slug, controller.signal))).then((results) => {
      if (controller.signal.aborted) return;

      const loaded: ProductsBySlug = {};
      const failed: string[] = [];

      results.forEach((result, index) => {
        const slug = toFetch[index];
        if (result.status === "fulfilled") loaded[slug] = result.value;
        else failed.push(slug);
      });

      setProducts((current) => ({ ...current, ...loaded }));
      setFailedSlugs(failed);
    });

    return () => controller.abort();
  }, [missingKey, attempt]);

  const failed = failedSlugs.some((slug) => missing.includes(slug));

  return {
    products,
    loading: missing.length > 0 && !failed,
    failed,
    retry: () => {
      setFailedSlugs([]);
      setAttempt((value) => value + 1);
    }
  };
}
