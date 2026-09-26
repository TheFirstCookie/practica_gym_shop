import type { VariantInput } from "@/lib/api/admin";
import type { AdminVariant } from "@/lib/api/types";

// The variants part of the product form: rows of strings while editing, converted and
// checked here before anything is sent.

export type VariantFormRow = {
  /** Stable React key; new rows have no database id yet. */
  key: string;
  id?: string;
  name: string;
  /** Dollars as typed. */
  price: string;
  stock: string;
  isActive: boolean;
};

export type VariantRowErrors = Partial<Record<"name" | "price" | "stock", string>>;
export type VariantErrors = Record<string, VariantRowErrors>;

/** Mirrors the API's limit. */
export const MAX_VARIANTS = 30;

const PRICE = /^\d+(\.\d{1,2})?$/;
const WHOLE_NUMBER = /^\d+$/;

let nextKey = 0;
const newKey = () => `new-${++nextKey}`;

export function toVariantRows(variants: AdminVariant[]): VariantFormRow[] {
  return variants.map((variant) => ({
    key: variant.id,
    id: variant.id,
    name: variant.name,
    price: (variant.priceCents / 100).toFixed(2),
    stock: String(variant.stock),
    isActive: variant.isActive
  }));
}

/** A blank row; starts from a nearby price (and stock) so it's quick to fill in. */
export function newVariantRow(price = "", stock = "0"): VariantFormRow {
  return { key: newKey(), name: "", price, stock, isActive: true };
}

const toCents = (price: string) => Math.round(Number(price.trim().replace(",", ".")) * 100);

export function toVariantInputs(
  rows: VariantFormRow[]
): { inputs: VariantInput[]; errors?: never } | { inputs?: never; errors: VariantErrors } {
  const errors: VariantErrors = {};
  const seen = new Set<string>();

  for (const row of rows) {
    const rowErrors: VariantRowErrors = {};
    const name = row.name.trim();

    if (!name) rowErrors.name = "Name it, e.g. 20 kg or M";
    else if (seen.has(name.toLowerCase())) rowErrors.name = "Another variant has this name";
    seen.add(name.toLowerCase());

    if (!PRICE.test(row.price.trim().replace(",", "."))) rowErrors.price = "Like 49 or 49.99";
    if (!WHOLE_NUMBER.test(row.stock.trim())) rowErrors.stock = "0 or more";

    if (Object.keys(rowErrors).length > 0) errors[row.key] = rowErrors;
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    inputs: rows.map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      name: row.name.trim(),
      priceCents: toCents(row.price),
      stock: Number(row.stock),
      isActive: row.isActive
    }))
  };
}

/**
 * What the product's own price and stock become with these variants: the cheapest one on
 * sale and their total (the database works these out the same way).
 */
export function variantTotals(inputs: VariantInput[]): { priceCents: number; stock: number } | null {
  if (inputs.length === 0) return null;
  const onSale = inputs.filter((variant) => variant.isActive);
  return {
    priceCents: onSale.length > 0 ? Math.min(...onSale.map((variant) => variant.priceCents)) : inputs[0]!.priceCents,
    stock: onSale.reduce((total, variant) => total + variant.stock, 0)
  };
}

/** Moves a row up (-1) or down (+1). */
export function moveRow<T>(rows: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= rows.length) return rows;
  const next = [...rows];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
