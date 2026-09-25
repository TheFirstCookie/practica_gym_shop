// The cart lives in localStorage, which is outside React. This module is the
// "external store" that <CartProvider> reads through useSyncExternalStore.

// Only slugs and quantities are stored. Prices and stock are always fetched fresh
// from the API, so a stale cart can't carry an old price into checkout.
export type CartLine = {
  slug: string;
  quantity: number;
};

/** Upper bound per line; the real limit is the product's stock, applied when it's known. */
export const MAX_LINE_QUANTITY = 99;

const storageKey = "forgefit-cart";
const listeners = new Set<() => void>();

// In-memory copy of the cart. It gives React a stable snapshot between changes,
// and keeps the cart working for this visit when storage is blocked (private mode).
let cache: CartLine[] | null = null;

// Drops malformed lines and duplicates, and keeps each quantity between 1 and the line cap.
// Products that no longer exist are removed by the cart page once the API says so.
function sanitize(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) {
    return [];
  }

  const result: CartLine[] = [];

  for (const line of lines as Partial<CartLine>[]) {
    const slug = line?.slug;

    if (typeof slug !== "string" || !slug || result.some((item) => item.slug === slug)) {
      continue;
    }

    const quantity = Math.min(Math.floor(Number(line.quantity)), MAX_LINE_QUANTITY);

    if (quantity >= 1) {
      result.push({ slug, quantity });
    }
  }

  return result;
}

function readStorage(): CartLine[] {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]"));
  } catch {
    return [];
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

// Another tab changed the cart: reload it so every open tab agrees.
function handleStorage(event: StorageEvent) {
  if (event.key === storageKey) {
    cache = readStorage();
    notify();
  }
}

export function subscribeToCart(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorage);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getCartSnapshot(): CartLine[] {
  cache ??= readStorage();
  return cache;
}

// The server has no localStorage; null tells the provider the cart isn't known yet.
export function getServerCartSnapshot(): CartLine[] | null {
  return null;
}

export function updateCart(update: (lines: CartLine[]) => CartLine[]) {
  cache = sanitize(update(getCartSnapshot()));

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(cache));
  } catch {
    // Storage can be blocked; the in-memory cache still holds the cart for this visit.
  }

  notify();
}
