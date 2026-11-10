import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/api/catalog", () => ({ getProduct: vi.fn() }));
import { getProduct } from "@/lib/api/catalog";
import { useCartProducts } from "@/app/components/use-cart-products";
describe("cart product refresh", () => {
  it("reports unresolved failed lines and retries previously loaded stock too", async () => {
    vi.mocked(getProduct).mockImplementation(async (slug) => {
      if (slug === "failed") throw new Error("offline");
      return { slug, stock: 0 } as Awaited<ReturnType<typeof getProduct>>;
    });
    const hook = renderHook(() => useCartProducts(["loaded", "failed"]));
    await waitFor(() => expect(hook.result.current.failed).toBe(true));
    expect(hook.result.current.products.failed).toBeUndefined();
    vi.mocked(getProduct).mockImplementation(async (slug) => ({ slug, stock: 10 }) as Awaited<ReturnType<typeof getProduct>>);
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.products.loaded?.stock).toBe(10));
    expect(hook.result.current.products.failed?.stock).toBe(10);
    expect(hook.result.current.failed).toBe(false);
  });
});
