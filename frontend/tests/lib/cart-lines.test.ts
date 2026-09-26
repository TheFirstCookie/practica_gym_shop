import { describe, expect, it } from "vitest";
import { itemLabel, resolveLine } from "@/lib/cart-lines";
import { formatProductPrice } from "@/lib/format";
import { bumperPlate, yogaMat } from "../fixtures/products";

describe("resolveLine", () => {
  it("prices a variant line from that variant", () => {
    expect(resolveLine(bumperPlate, { slug: "bumper-plate", variant: "v-20" })).toEqual({
      variantName: "20 kg",
      priceCents: 8900,
      stock: 3
    });
  });

  it("prices a plain product from the product", () => {
    expect(resolveLine(yogaMat, { slug: "yoga-mat" })).toEqual({ variantName: null, priceCents: 2900, stock: 4 });
  });

  it("can't buy a line whose option is gone, or that needs one", () => {
    expect(resolveLine(bumperPlate, { slug: "bumper-plate", variant: "v-deleted" })).toBeNull();
    expect(resolveLine(bumperPlate, { slug: "bumper-plate" })).toBeNull();
    expect(resolveLine(yogaMat, { slug: "yoga-mat", variant: "v-10" })).toBeNull();
  });
});

describe("price labels", () => {
  it("says From when the variants cost different amounts", () => {
    expect(formatProductPrice(bumperPlate)).toBe("From $49");
    expect(formatProductPrice(yogaMat)).toBe("$29");
    expect(formatProductPrice({ ...bumperPlate, priceMaxCents: 4900 })).toBe("$49");
  });

  it("names a line with its variant", () => {
    expect(itemLabel("Bumper Plate", "20 kg")).toBe("Bumper Plate (20 kg)");
    expect(itemLabel("Yoga Mat", null)).toBe("Yoga Mat");
  });
});
