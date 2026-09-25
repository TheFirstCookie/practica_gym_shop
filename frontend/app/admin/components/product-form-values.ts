import type { ProductInput } from "@/lib/api/admin";
import type { AdminProduct } from "@/lib/api/types";

// The form edits strings (that's what inputs hold); these helpers convert to and from the
// API's shape and catch the mistakes worth flagging before a round trip.

export type ProductFormValues = {
  name: string;
  slug: string;
  categoryId: string;
  brandId: string;
  /** Dollars as typed, e.g. "29.99". */
  price: string;
  stock: string;
  tag: string;
  description: string;
  /** One spec per line. */
  specs: string;
  imageUrl: string | null;
  sortOrder: string;
  isActive: boolean;
};

export type ProductFormField = keyof ProductFormValues;
export type FieldErrors = Partial<Record<ProductFormField, string>>;

export const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  brandId: "",
  price: "",
  stock: "0",
  tag: "",
  description: "",
  specs: "",
  imageUrl: null,
  sortOrder: "0",
  isActive: true
};

export function toFormValues(product: AdminProduct): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    categoryId: product.category.id,
    brandId: product.brand.id,
    price: (product.priceCents / 100).toFixed(2),
    stock: String(product.stock),
    tag: product.tag ?? "",
    description: product.description,
    specs: product.specs.join("\n"),
    imageUrl: product.image,
    sortOrder: String(product.sortOrder),
    isActive: product.isActive
  };
}

/** "Pro Bench 2.0" -> "pro-bench-2-0"; mirrors the API's slug rules. */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

const PRICE = /^\d+(\.\d{1,2})?$/;
const WHOLE_NUMBER = /^-?\d+$/;

export function toProductInput(
  values: ProductFormValues
): { input: ProductInput; errors?: never } | { input?: never; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const price = values.price.trim().replace(",", ".");

  if (!values.name.trim()) errors.name = "Give the product a name";
  if (!values.categoryId) errors.categoryId = "Pick a category";
  if (!values.brandId) errors.brandId = "Pick a brand";
  if (!PRICE.test(price)) errors.price = "Enter a price like 49 or 49.99";
  if (!WHOLE_NUMBER.test(values.stock.trim()) || Number(values.stock) < 0) {
    errors.stock = "Enter a whole number, 0 or more";
  }
  if (!WHOLE_NUMBER.test(values.sortOrder.trim())) errors.sortOrder = "Enter a whole number";
  // The API only accepts https images, so pages never mix in insecure content.
  if (values.imageUrl && !values.imageUrl.startsWith("https://")) {
    errors.imageUrl = "Use an https:// link";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    input: {
      name: values.name.trim(),
      slug: values.slug.trim() || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId,
      // Rounding avoids float noise: 19.99 * 100 is 1998.9999999999998.
      priceCents: Math.round(Number(price) * 100),
      stock: Number(values.stock),
      tag: values.tag.trim() || null,
      imageUrl: values.imageUrl,
      description: values.description.trim(),
      specs: values.specs
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      sortOrder: Number(values.sortOrder),
      isActive: values.isActive
    }
  };
}

// API field names that differ from the form's.
const FIELD_BY_API_PATH: Record<string, ProductFormField> = {
  priceCents: "price",
  imageUrl: "imageUrl"
};

/** Maps the API's validation `details` (paths like "priceCents" or "specs.2") onto form fields. */
export function toFieldErrors(issues: { path: string; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of issues) {
    const root = issue.path.split(".")[0] ?? "";
    const field = FIELD_BY_API_PATH[root] ?? (root in emptyProductForm ? (root as ProductFormField) : null);
    if (field && !errors[field]) errors[field] = issue.message;
  }

  return errors;
}
