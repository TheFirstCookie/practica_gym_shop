import { describe, expect, it } from "vitest";
import {
  moveRow,
  newVariantRow,
  toVariantInputs,
  toVariantRows,
  variantTotals
} from "@/app/admin/components/variant-form-values";

const row = (name: string, price: string, stock: string, isActive = true) => ({
  ...newVariantRow(price, stock),
  name,
  isActive
});

describe("variant rows", () => {
  it("round-trip the API's variants", () => {
    const rows = toVariantRows([{ id: "v1", name: "S", priceCents: 1999, stock: 2, isActive: false }]);
    expect(rows).toEqual([{ key: "v1", id: "v1", name: "S", price: "19.99", stock: "2", isActive: false }]);
    expect(toVariantInputs(rows).inputs).toEqual([{ id: "v1", name: "S", priceCents: 1999, stock: 2, isActive: false }]);
  });

  it("send new rows without an id, in cents", () => {
    expect(toVariantInputs([row(" 20 kg ", "89,90", "3")]).inputs).toEqual([
      { name: "20 kg", priceCents: 8990, stock: 3, isActive: true }
    ]);
  });

  it("flag missing names, duplicates and bad numbers on the right row", () => {
    const rows = [row("M", "10", "1"), row("m", "x", "-1"), row("", "10", "1.5")];
    const { errors } = toVariantInputs(rows);
    expect(errors).toEqual({
      [rows[1]!.key]: { name: "Another variant has this name", price: "Like 49 or 49.99", stock: "0 or more" },
      [rows[2]!.key]: { name: "Name it, e.g. 20 kg or M", stock: "0 or more" }
    });
  });

  it("work out the product's price and stock like the database", () => {
    const { inputs } = toVariantInputs([row("S", "30", "2"), row("M", "25", "4"), row("XL", "10", "9", false)]);
    expect(variantTotals(inputs!)).toEqual({ priceCents: 2500, stock: 6 });
    expect(variantTotals([])).toBeNull();
  });

  it("move rows up and down within the list", () => {
    expect(moveRow(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveRow(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
  });
});
