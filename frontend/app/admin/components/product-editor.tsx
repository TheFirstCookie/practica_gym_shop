"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { createProduct, getAdminProduct, saveProductVariants, updateProduct } from "@/lib/api/admin";
import { getBrands, getCategories } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import type { Brand, Category } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { useAdminApi } from "../use-admin-api";
import { ImageField } from "./image-field";
import {
  emptyProductForm,
  slugify,
  toFieldErrors,
  toFormValues,
  toProductInput,
  type FieldErrors,
  type ProductFormField,
  type ProductFormValues
} from "./product-form-values";
import { VariantEditor } from "./variant-editor";
import {
  toVariantInputs,
  toVariantRows,
  variantTotals,
  type VariantErrors,
  type VariantFormRow
} from "./variant-form-values";

type EditorData = {
  categories: Category[];
  brands: Brand[];
  initial: ProductFormValues;
  initialVariants: VariantFormRow[];
};

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: EditorData };

/** Create (no productId) or edit a product. */
export function ProductEditor({ productId }: { productId?: string }) {
  const { run } = useAdminApi();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;

    Promise.all([
      getCategories(),
      getBrands(),
      productId ? run((token) => getAdminProduct(token, productId)) : Promise.resolve(null)
    ])
      .then(([categories, brands, product]) => {
        if (!current) return;
        const initial = product ? toFormValues(product) : emptyProductForm;
        const initialVariants = product ? toVariantRows(product.variants) : [];
        setLoad({ status: "ready", data: { categories, brands, initial, initialVariants } });
      })
      .catch((error: unknown) => {
        if (!current) return;
        const message =
          error instanceof ApiError && error.isNotFound
            ? "This product doesn't exist (anymore)."
            : error instanceof Error
              ? error.message
              : "Couldn't load the form";
        setLoad({ status: "error", message });
      });

    return () => {
      current = false;
    };
  }, [run, productId, attempt]);

  return (
    <section className="admin-section admin-editor">
      <Link href="/admin/products" className="admin-back-link">
        <ArrowLeft size={15} />
        <span>All products</span>
      </Link>

      {load.status === "loading" && <p className="admin-status">Loading…</p>}

      {load.status === "error" && (
        <div className="admin-card admin-inline-card">
          <p>{load.message}</p>
          <button type="button" className="button secondary" onClick={() => setAttempt((n) => n + 1)}>
            <RotateCcw size={16} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {load.status === "ready" && (
        // Keyed so switching between products starts from fresh form state.
        <ProductForm key={productId ?? "new"} productId={productId} data={load.data} />
      )}
    </section>
  );
}

type ProductFormProps = {
  productId?: string;
  data: EditorData;
};

function ProductForm({ productId, data }: ProductFormProps) {
  const router = useRouter();
  const { run, refreshShop } = useAdminApi();
  const isNew = !productId;

  const [values, setValues] = useState(data.initial);
  // New products get a slug from their name until someone edits the slug by hand.
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [variants, setVariants] = useState(data.initialVariants);
  const [variantErrors, setVariantErrors] = useState<VariantErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends ProductFormField>(field: K, value: ProductFormValues[K]) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !slugEdited) next.slug = slugify(String(value));
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function changeVariants(next: VariantFormRow[]) {
    if (next.length === 0 && variants.length > 0) {
      // Back to a plain product: start its own price and stock from what the variants had.
      const stock = variants.reduce((total, row) => total + (Number(row.stock) || 0), 0);
      setValues((current) => ({ ...current, price: variants[0]!.price, stock: String(stock) }));
    }
    setVariants(next);
    setVariantErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const variantResult = toVariantInputs(variants);
    const totals = variantResult.inputs ? variantTotals(variantResult.inputs) : null;
    // With variants, the product's own price and stock are theirs (the API recomputes them too).
    const result = toProductInput(
      totals ? { ...values, price: (totals.priceCents / 100).toFixed(2), stock: String(totals.stock) } : values
    );
    setVariantErrors(variantResult.errors ?? {});
    if (result.errors || variantResult.errors) {
      setErrors(result.errors ?? {});
      setFormError("Some fields need attention.");
      return;
    }

    // Only touch variants when there are or were some, so plain products save as before.
    const variantInputs = variantResult.inputs;
    const saveVariants = variants.length > 0 || data.initialVariants.length > 0;

    setSaving(true);
    // Which request failed decides what to tell the admin.
    let step: "product" | "variants" = "product";
    let createdId: string | null = null;
    try {
      if (productId) {
        // Variants first: while a product has any, the database works out its price and
        // stock from them, so removing the last one must happen before those are written.
        if (saveVariants) {
          step = "variants";
          const saved = await run((token) => saveProductVariants(token, productId, variantInputs));
          // New rows have ids now, so saving again updates them instead of adding more.
          setVariants(toVariantRows(saved.variants));
        }
        step = "product";
        await run((token) => updateProduct(token, productId, result.input));
      } else {
        const product = await run((token) => createProduct(token, result.input));
        createdId = product.id;
        if (saveVariants) {
          step = "variants";
          await run((token) => saveProductVariants(token, product.id, variantInputs));
        }
      }
      await refreshShop();
      router.push(`/admin/products?notice=${isNew ? "created" : "updated"}`);
    } catch (error) {
      setSaving(false);
      if (createdId) {
        // The product exists now; saving this form again would create a second one.
        await refreshShop();
        router.push("/admin/products?notice=created-without-variants");
        return;
      }
      if (step === "variants") {
        setFormError(
          error instanceof ApiError && error.status === 409
            ? "Two variants can't have the same name."
            : error instanceof Error
              ? error.message
              : "Couldn't save the variants"
        );
      } else if (error instanceof ApiError && error.status === 409) {
        setErrors({ slug: "Another product already uses this URL name" });
        setFormError("Pick a different URL name.");
      } else if (error instanceof ApiError && error.fieldIssues.length > 0) {
        setErrors(toFieldErrors(error.fieldIssues));
        setFormError("Some fields need attention.");
      } else {
        setFormError(error instanceof Error ? error.message : "Couldn't save the product");
      }
    }
  }

  return (
    <form className="admin-form admin-product-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">{isNew ? "New product" : "Edit product"}</p>
          <h1>{values.name.trim() || (isNew ? "Untitled product" : "Product")}</h1>
        </div>
        <FormActions saving={saving} />
      </div>

      {formError && (
        <p className="admin-error" role="alert">
          {formError}
        </p>
      )}

      {/* Two columns: what the product is on the left, how it sells on the right. */}
      <div className="admin-form-grid">
        <div className="admin-form-column">
          <fieldset className="admin-panel">
            <legend>Basics</legend>
            <Field label="Name" error={errors.name}>
              {(id) => (
                <input
                  id={id}
                  value={values.name}
                  maxLength={160}
                  required
                  onChange={(event) => set("name", event.target.value)}
                />
              )}
            </Field>
            <Field
              label="URL name"
              hint={values.slug ? `Shown at /product/${values.slug}` : "Generated from the name"}
              error={errors.slug}
            >
              {(id) => (
                <input
                  id={id}
                  value={values.slug}
                  maxLength={160}
                  onChange={(event) => {
                    setSlugEdited(true);
                    set("slug", slugify(event.target.value));
                  }}
                />
              )}
            </Field>
            <div className="admin-field-row">
              <Field label="Category" error={errors.categoryId}>
                {(id) => (
                  <select id={id} value={values.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
                    <option value="">Choose…</option>
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Brand" error={errors.brandId}>
                {(id) => (
                  <select id={id} value={values.brandId} onChange={(event) => set("brandId", event.target.value)}>
                    <option value="">Choose…</option>
                    {data.brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <Field label="Tag" hint='Short label on the photo, e.g. "New" or "Low stock"' error={errors.tag}>
              {(id) => (
                <input id={id} value={values.tag} maxLength={30} onChange={(event) => set("tag", event.target.value)} />
              )}
            </Field>
          </fieldset>
          <fieldset className="admin-panel">
            <legend>Details</legend>
            <Field label="Description" error={errors.description}>
              {(id) => (
                <textarea
                  id={id}
                  rows={4}
                  maxLength={2000}
                  value={values.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              )}
            </Field>
            <Field label="Specs" hint="One per line, up to 12" error={errors.specs}>
              {(id) => (
                <textarea
                  id={id}
                  rows={4}
                  value={values.specs}
                  placeholder={"5-30 kg pairs\nKnurled steel grip"}
                  onChange={(event) => set("specs", event.target.value)}
                />
              )}
            </Field>
          </fieldset>
        </div>
        <div className="admin-form-column">
          <fieldset className="admin-panel">
            <legend>Price and stock</legend>
            {variants.length > 0 ? (
              <VariantTotals rows={variants} />
            ) : (
              <div className="admin-field-row">
                <Field label="Price (USD)" error={errors.price}>
                  {(id) => (
                    <input
                      id={id}
                      inputMode="decimal"
                      placeholder="49.99"
                      value={values.price}
                      onChange={(event) => set("price", event.target.value)}
                    />
                  )}
                </Field>
                <Field label="In stock" error={errors.stock}>
                  {(id) => (
                    <input
                      id={id}
                      type="number"
                      min={0}
                      step={1}
                      value={values.stock}
                      onChange={(event) => set("stock", event.target.value)}
                    />
                  )}
                </Field>
              </div>
            )}
          </fieldset>
          <fieldset className="admin-panel">
            <legend>Photo</legend>
            <ImageField value={values.imageUrl} onChange={(url) => set("imageUrl", url)} error={errors.imageUrl} />
          </fieldset>
          <fieldset className="admin-panel">
            <legend>Visibility</legend>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => set("isActive", event.target.checked)}
              />
              <span>
                <strong>Show in the shop</strong>
                <small>Hidden products keep their data and past orders; turn this back on anytime.</small>
              </span>
            </label>
            <Field label="Featured order" hint="Lower numbers appear first in the default sort" error={errors.sortOrder}>
              {(id) => (
                <input
                  id={id}
                  type="number"
                  step={1}
                  value={values.sortOrder}
                  onChange={(event) => set("sortOrder", event.target.value)}
                />
              )}
            </Field>
          </fieldset>
        </div>
      </div>

      <VariantEditor
        rows={variants}
        errors={variantErrors}
        onChange={changeVariants}
        defaultPrice={values.price}
        defaultStock={values.stock}
      />

      <div className="admin-form-footer">
        <Link href="/admin/products" className="button secondary">
          Cancel
        </Link>
        <FormActions saving={saving} />
      </div>
    </form>
  );
}

/** With variants, the product's price and stock are worked out from them. */
function VariantTotals({ rows }: { rows: VariantFormRow[] }) {
  const result = toVariantInputs(rows);
  const totals = result.inputs ? variantTotals(result.inputs) : null;
  const prices = result.inputs?.filter((variant) => variant.isActive).map((variant) => variant.priceCents) ?? [];
  const range =
    totals && prices.length > 0
      ? Math.max(...prices) > totals.priceCents
        ? `${formatPrice(totals.priceCents)} – ${formatPrice(Math.max(...prices))}`
        : formatPrice(totals.priceCents)
      : "–";

  return (
    <div className="admin-variant-totals">
      <p>
        <span>Price</span>
        <strong>{range}</strong>
      </p>
      <p>
        <span>In stock</span>
        <strong>{totals ? totals.stock : "–"}</strong>
      </p>
      <small className="admin-hint">Set per variant below. Shoppers see the lowest price as “From …”.</small>
    </div>
  );
}

function FormActions({ saving }: { saving: boolean }) {
  return (
    <button type="submit" className="button primary" disabled={saving}>
      <Save size={17} />
      <span>{saving ? "Saving…" : "Save product"}</span>
    </button>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  /** Receives the input id, so the label and error are wired up for screen readers. */
  children: (id: string) => ReactNode;
};

function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();

  return (
    <div className="admin-field" data-invalid={error ? true : undefined}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error ? (
        <p className="admin-field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <small className="admin-hint">{hint}</small>
      )}
    </div>
  );
}
