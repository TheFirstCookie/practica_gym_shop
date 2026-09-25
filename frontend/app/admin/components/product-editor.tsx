"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import { createProduct, getAdminProduct, updateProduct } from "@/lib/api/admin";
import { getBrands, getCategories } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import type { Brand, Category } from "@/lib/api/types";
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

type EditorData = {
  categories: Category[];
  brands: Brand[];
  initial: ProductFormValues;
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
        setLoad({ status: "ready", data: { categories, brands, initial } });
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = toProductInput(values);
    if (result.errors) {
      setErrors(result.errors);
      setFormError("Some fields need attention.");
      return;
    }

    setSaving(true);
    try {
      await run((token) =>
        productId ? updateProduct(token, productId, result.input) : createProduct(token, result.input)
      );
      await refreshShop();
      router.push(`/admin/products?notice=${isNew ? "created" : "updated"}`);
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.status === 409) {
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

      <div className="admin-form-footer">
        <Link href="/admin/products" className="button secondary">
          Cancel
        </Link>
        <FormActions saving={saving} />
      </div>
    </form>
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
