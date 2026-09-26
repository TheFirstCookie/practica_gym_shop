import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/app/components/cart-provider";
import { CartView } from "@/app/components/cart-view";
import { useCustomerSession } from "@/app/components/customer-session";
import { getProduct } from "@/lib/api/catalog";
import { createCheckoutSession } from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";
import { getCartSnapshot, updateCart } from "@/lib/cart-store";
import { bumperPlate, yogaMat } from "../fixtures/products";

vi.mock("@/lib/api/catalog", { spy: true });
vi.mock("@/lib/api/checkout", { spy: true });
vi.mock("@/app/components/customer-session", { spy: true });

beforeEach(() => {
  updateCart(() => []);
  vi.mocked(useCustomerSession).mockReturnValue({
    state: { status: "signed-out" },
    customer: null,
    getToken: async () => null
  } as unknown as ReturnType<typeof useCustomerSession>);
  vi.mocked(getProduct).mockImplementation(async (slug) =>
    slug === bumperPlate.slug ? bumperPlate : slug === yogaMat.slug ? yogaMat : null
  );
});

function renderCart() {
  return render(
    <CartProvider>
      <CartView />
    </CartProvider>
  );
}

describe("a cart with variants", () => {
  it("lists each option on its own line, priced from that option", async () => {
    updateCart(() => [
      { slug: "bumper-plate", variant: "v-10", quantity: 2 },
      { slug: "bumper-plate", variant: "v-20", quantity: 1 }
    ]);
    renderCart();

    const lines = await screen.findAllByRole("article");
    expect(within(lines[0]!).getByText("10 kg")).toBeInTheDocument();
    expect(within(lines[0]!).getByText("$98")).toBeInTheDocument();
    expect(within(lines[1]!).getByText("20 kg")).toBeInTheDocument();
    expect(within(lines[1]!).getByText("$89")).toBeInTheDocument();
    expect(screen.getByText("$187")).toBeInTheDocument();
    // One product, fetched once.
    expect(getProduct).toHaveBeenCalledTimes(1);
  });

  it("asks to choose again when the saved option isn't sold anymore", async () => {
    updateCart(() => [{ slug: "bumper-plate", variant: "v-gone", quantity: 1 }]);
    renderCart();

    expect(await screen.findByText(/The option you picked isn't sold anymore/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose again" })).toHaveAttribute("href", "/product/bumper-plate");
    expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
  });

  it("sends the variants to checkout and fixes only the line that ran short", async () => {
    updateCart(() => [
      { slug: "bumper-plate", variant: "v-10", quantity: 2 },
      { slug: "bumper-plate", variant: "v-20", quantity: 3 }
    ]);
    vi.mocked(createCheckoutSession).mockRejectedValue(
      new ApiError(409, "insufficient_stock", "", { slug: "bumper-plate", variant: "v-20", available: 1 })
    );
    renderCart();

    await userEvent.click(await screen.findByRole("button", { name: "Checkout" }));

    expect(createCheckoutSession).toHaveBeenCalledWith(
      [
        { slug: "bumper-plate", variant: "v-10", quantity: 2 },
        { slug: "bumper-plate", variant: "v-20", quantity: 3 }
      ],
      undefined
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Only 1 of Bumper Plate (20 kg) left");
    expect(getCartSnapshot()).toEqual([
      { slug: "bumper-plate", variant: "v-10", quantity: 2 },
      { slug: "bumper-plate", variant: "v-20", quantity: 1 }
    ]);
  });
});
