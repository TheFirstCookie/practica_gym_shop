import { beforeEach, describe, expect, it, vi } from "vitest";

// The store keeps an in-memory copy, so each test loads a fresh module.
async function loadStore() {
  vi.resetModules();
  return import("@/lib/cart-store");
}

beforeEach(() => window.localStorage.clear());

describe("cart store", () => {
  it("starts empty and saves changes to localStorage", async () => {
    const store = await loadStore();
    expect(store.getCartSnapshot()).toEqual([]);

    store.updateCart((lines) => [...lines, { slug: "competition-kettlebell", quantity: 2 }]);

    expect(store.getCartSnapshot()).toEqual([{ slug: "competition-kettlebell", quantity: 2 }]);
    expect(JSON.parse(window.localStorage.getItem("forgefit-cart")!)).toEqual([
      { slug: "competition-kettlebell", quantity: 2 }
    ]);
  });

  it("cleans up a tampered or outdated saved cart", async () => {
    window.localStorage.setItem(
      "forgefit-cart",
      JSON.stringify([
        { slug: "mat", quantity: 2 },
        { slug: "mat", quantity: 5 },
        { slug: "", quantity: 1 },
        { slug: "bike", quantity: 0 },
        { slug: "rack", quantity: 500 },
        { slug: "roller", quantity: "3" },
        "junk"
      ])
    );
    const store = await loadStore();

    expect(store.getCartSnapshot()).toEqual([
      { slug: "mat", quantity: 2 },
      { slug: "rack", quantity: store.MAX_LINE_QUANTITY },
      { slug: "roller", quantity: 3 }
    ]);
  });

  it("keeps each variant of a product as its own line", async () => {
    window.localStorage.setItem(
      "forgefit-cart",
      JSON.stringify([
        { slug: "plate", variant: "v-10", quantity: 2 },
        { slug: "plate", variant: "v-20", quantity: 1 },
        { slug: "plate", variant: "v-10", quantity: 4 },
        { slug: "plate", quantity: 1 },
        { slug: "plate", variant: "", quantity: 1 },
        { slug: "plate", variant: 7, quantity: 1 }
      ])
    );
    const store = await loadStore();

    expect(store.getCartSnapshot()).toEqual([
      { slug: "plate", variant: "v-10", quantity: 2 },
      { slug: "plate", variant: "v-20", quantity: 1 },
      { slug: "plate", quantity: 1 }
    ]);
    expect(store.lineKey({ slug: "plate", variant: "v-10" })).toBe("plate:v-10");
    expect(store.isSameLine({ slug: "plate" }, { slug: "plate", variant: "v-10" })).toBe(false);
  });

  it("survives a corrupt value", async () => {
    window.localStorage.setItem("forgefit-cart", "{not json");
    const store = await loadStore();
    expect(store.getCartSnapshot()).toEqual([]);
  });

  it("tells subscribers about changes, including ones from other tabs", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeToCart(listener);

    store.updateCart(() => [{ slug: "mat", quantity: 1 }]);
    expect(listener).toHaveBeenCalledTimes(1);

    window.localStorage.setItem("forgefit-cart", JSON.stringify([{ slug: "bike", quantity: 1 }]));
    window.dispatchEvent(new StorageEvent("storage", { key: "forgefit-cart" }));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getCartSnapshot()).toEqual([{ slug: "bike", quantity: 1 }]);

    unsubscribe();
    store.updateCart(() => []);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("has no cart on the server", async () => {
    const store = await loadStore();
    expect(store.getServerCartSnapshot()).toBeNull();
  });
});
