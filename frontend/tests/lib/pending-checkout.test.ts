import { beforeEach, describe, expect, it, vi } from "vitest";
beforeEach(() => { window.sessionStorage.clear(); window.localStorage.clear(); vi.resetModules(); });
describe("receipt cart cleanup", () => {
  it("does not clear a new cart when an old receipt is revisited", async () => {
    const store = await import("@/lib/cart-store");
    const checkout = await import("@/lib/pending-checkout");
    store.updateCart(() => [{ slug: "new-item", quantity: 1 }]);
    checkout.completePendingCheckout("cs_test_old");
    expect(store.getCartSnapshot()).toEqual([{ slug: "new-item", quantity: 1 }]);
  });
  it("subtracts purchased quantities once and preserves later additions", async () => {
    const store = await import("@/lib/cart-store");
    const checkout = await import("@/lib/pending-checkout");
    checkout.rememberPendingCheckout("cs_test_new", [{ slug: "plate", variant: "v1", quantity: 2 }]);
    store.updateCart(() => [{ slug: "plate", variant: "v1", quantity: 3 }, { slug: "mat", quantity: 1 }]);
    checkout.completePendingCheckout("cs_test_old");
    checkout.completePendingCheckout("cs_test_new");
    checkout.completePendingCheckout("cs_test_new");
    expect(store.getCartSnapshot()).toEqual([{ slug: "plate", variant: "v1", quantity: 1 }, { slug: "mat", quantity: 1 }]);
  });
});
