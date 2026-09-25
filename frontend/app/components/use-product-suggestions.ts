"use client";

import { useEffect, useState } from "react";
import { listProducts } from "@/lib/api/catalog";
import type { ProductSummary } from "@/lib/api/types";

const DEBOUNCE_MS = 200;

type Result = {
  query: string;
  products: ProductSummary[];
  total: number;
  failed: boolean;
};

export type Suggestions = {
  products: ProductSummary[];
  total: number;
  /** True while the latest query's results haven't arrived yet. */
  loading: boolean;
  failed: boolean;
};

/**
 * Live search results for the header search box: waits for a pause in typing, cancels
 * requests that a newer keystroke made obsolete, and keeps the last results on screen
 * while the next ones load so the list doesn't flicker.
 */
export function useProductSuggestions(query: string, limit: number): Suggestions {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!query) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      listProducts({ q: query, pageSize: limit }, controller.signal)
        .then((list) =>
          setResult({ query, products: list.data, total: list.meta.pagination.total, failed: false })
        )
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error("Search suggestions failed", error);
          setResult({ query, products: [], total: 0, failed: true });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, limit]);

  return {
    products: result?.products ?? [],
    total: result?.total ?? 0,
    loading: Boolean(query) && result?.query !== query,
    failed: result?.query === query && result.failed
  };
}
