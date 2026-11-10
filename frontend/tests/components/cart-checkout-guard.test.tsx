import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { bumperPlate } from "@/tests/fixtures/products";
vi.mock("@/app/components/cart-provider", () => ({ useCart: () => ({
  ready: true, count: 2, lines: [{ slug: "loaded", quantity: 1 }, { slug: "failed", quantity: 1 }],
  setQuantity: vi.fn(), remove: vi.fn()
}) }));
vi.mock("@/app/components/use-cart-products", () => ({ useCartProducts: () => ({
  products: { loaded: { ...bumperPlate, slug: "loaded", stock: 10, hasVariants: false, variants: [] } },
  loading: false, failed: true, retry: vi.fn()
}) }));
vi.mock("@/app/components/customer-session", () => ({
  useCustomerSession: () => ({ state: { status: "signed-out" }, customer: null, getToken: vi.fn() }),
  signInHref: () => "/account/sign-in"
}));
import { CartView } from "@/app/components/cart-view";
it("blocks checkout rather than silently buying the successfully loaded subset", () => {
  render(<CartView />);
  expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("couldn't be loaded");
});
