import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider } from "@/app/components/cart-provider";
import { ProductPurchase } from "@/app/components/product-purchase";
import { getCartSnapshot, updateCart } from "@/lib/cart-store";
import { bumperPlate, yogaMat } from "../fixtures/products";

// The store keeps an in-memory copy between tests; start each one with an empty cart.
beforeEach(() => updateCart(() => []));

function renderPurchase(product = bumperPlate) {
  return render(
    <CartProvider>
      <ProductPurchase product={product} />
    </CartProvider>
  );
}

describe("ProductPurchase", () => {
  it("opens on the first option in stock, with its price", () => {
    renderPurchase();

    expect(screen.getByRole("radio", { name: /10 kg/ })).toBeChecked();
    expect(screen.getByText("$49", { selector: ".price-row strong" })).toBeInTheDocument();
    expect(screen.getByText("5 in stock")).toBeInTheDocument();
  });

  it("follows the chosen option and adds that option to the cart", async () => {
    renderPurchase();

    await userEvent.click(screen.getByRole("radio", { name: /20 kg/ }));
    expect(screen.getByText("$89", { selector: ".price-row strong" })).toBeInTheDocument();
    expect(screen.getByText("3 in stock")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Increase Bumper Plate (20 kg) quantity" }));
    await userEvent.click(screen.getByRole("button", { name: /Add to cart/ }));

    expect(getCartSnapshot()).toEqual([{ slug: "bumper-plate", variant: "v-20", quantity: 2 }]);
    expect(screen.getByText(/2 in your cart/)).toBeInTheDocument();
  });

  it("keeps each option's count separate", async () => {
    updateCart(() => [{ slug: "bumper-plate", variant: "v-20", quantity: 3 }]);
    renderPurchase();

    // All three 20 kg plates are in the cart, but the 10 kg ones are still available.
    await userEvent.click(screen.getByRole("radio", { name: /20 kg/ }));
    expect(screen.getByRole("button", { name: /All stock in cart/ })).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: /10 kg/ }));
    expect(screen.getByRole("button", { name: /Add to cart/ })).toBeEnabled();
  });

  it("shows a sold-out option as sold out", async () => {
    renderPurchase();

    await userEvent.click(screen.getByRole("radio", { name: /25 kg/ }));

    expect(screen.getByRole("button", { name: /Sold out/ })).toBeDisabled();
  });

  it("has no picker for a plain product", async () => {
    renderPurchase(yogaMat);

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Add to cart/ }));
    expect(getCartSnapshot()).toEqual([{ slug: "yoga-mat", quantity: 1 }]);
  });
});
