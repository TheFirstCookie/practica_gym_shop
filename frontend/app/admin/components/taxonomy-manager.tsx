"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Check, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useAdminApi } from "../use-admin-api";
import { slugify } from "./product-form-values";

/** What categories and brands have in common; categories add a colour and an order. */
export type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  accent?: string;
  sortOrder?: number;
  productCount: number;
  activeProductCount: number;
};

export type TaxonomyValues = {
  name: string;
  slug: string;
  accent: string;
  sortOrder: string;
};

export type TaxonomyInput = {
  name: string;
  slug?: string;
  accent?: string;
  sortOrder?: number;
};

/** The API calls and wording for one kind of taxonomy. */
export type TaxonomyConfig<T extends TaxonomyItem> = {
  /** "category" / "brand", used in messages. */
  noun: string;
  title: string;
  intro: string;
  /** Categories have a tile colour and a display order; brands don't. */
  hasAccentAndOrder: boolean;
  list: (token: string) => Promise<T[]>;
  create: (token: string, input: TaxonomyInput) => Promise<T>;
  update: (token: string, id: string, input: TaxonomyInput) => Promise<T>;
  remove: (token: string, id: string) => Promise<void>;
};

const DEFAULT_ACCENT = "#ff6b1a";
const HEX = /^#[0-9a-fA-F]{6}$/;

const emptyValues: TaxonomyValues = { name: "", slug: "", accent: DEFAULT_ACCENT, sortOrder: "0" };

type FieldErrors = Partial<Record<keyof TaxonomyValues, string>>;

function toValues(item: TaxonomyItem): TaxonomyValues {
  return {
    name: item.name,
    slug: item.slug,
    accent: item.accent ?? DEFAULT_ACCENT,
    sortOrder: String(item.sortOrder ?? 0)
  };
}

/** Checks the form and builds the request body; the API re-checks everything. */
function toInput(values: TaxonomyValues, withAccentAndOrder: boolean): { input?: TaxonomyInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  const slug = values.slug.trim();

  if (!name) errors.name = "Add a name";
  else if (name.length > 80) errors.name = "Keep it under 80 characters";
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.slug = "Lowercase letters, numbers and hyphens";

  const input: TaxonomyInput = { name, slug: slug || undefined };

  if (withAccentAndOrder) {
    if (!HEX.test(values.accent)) errors.accent = "Use a colour like #ff6b1a";
    const sortOrder = Number(values.sortOrder);
    if (!Number.isInteger(sortOrder)) errors.sortOrder = "A whole number";
    input.accent = values.accent.toLowerCase();
    input.sortOrder = sortOrder;
  }

  return Object.keys(errors).length ? { errors } : { input, errors };
}

function describeError(error: unknown, noun: string): { message: string; fields?: FieldErrors } {
  if (error instanceof ApiError) {
    if (error.code === "conflict") {
      return { message: `Another ${noun} already uses this URL name.`, fields: { slug: "Already taken" } };
    }
    if (error.code === "in_use") return { message: error.message };
    if (error.isNotFound) return { message: `This ${noun} was already deleted. The list has been refreshed.` };
    return { message: error.message };
  }
  return { message: error instanceof Error ? error.message : "That didn't work" };
}

const countProducts = (count: number) => `${count} ${count === 1 ? "product" : "products"}`;

function productSummary(item: TaxonomyItem): string {
  if (item.productCount === 0) return "No products";
  const hidden = item.productCount - item.activeProductCount;
  const live = `${item.activeProductCount} in shop`;
  return hidden > 0 ? `${live} · ${hidden} hidden` : live;
}

type LoadState<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; items: T[] };

/** List, add, edit and delete categories or brands, all on one page. */
export function TaxonomyManager<T extends TaxonomyItem>({ config }: { config: TaxonomyConfig<T> }) {
  const { run, refreshShop } = useAdminApi();
  const [load, setLoad] = useState<LoadState<T>>({ status: "loading" });
  const [reloadCount, setReloadCount] = useState(0);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    run(config.list)
      .then((items) => current && setLoad({ status: "ready", items }))
      .catch((error: unknown) => {
        if (current) setLoad({ status: "error", message: error instanceof Error ? error.message : "Couldn't load" });
      });
    return () => {
      current = false;
    };
  }, [run, config, reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  /** After any change: refresh the storefront's cached menus and reload the list. */
  async function afterChange(text: string) {
    setNotice({ tone: "ok", text });
    await refreshShop();
    reload();
  }

  async function remove(item: T) {
    setBusyId(item.id);
    setNotice(null);
    try {
      await run((token) => config.remove(token, item.id));
      setConfirmingId(null);
      await afterChange(`Deleted "${item.name}".`);
    } catch (error) {
      setNotice({ tone: "error", text: describeError(error, config.noun).message });
      reload();
    } finally {
      setBusyId(null);
    }
  }

  const items = load.status === "ready" ? load.items : [];

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>{config.title}</h1>
        </div>
      </div>
      <p className="admin-intro">{config.intro}</p>

      {notice && (
        <p
          className={notice.tone === "ok" ? "admin-notice" : "admin-error"}
          role={notice.tone === "ok" ? "status" : "alert"}
        >
          <span>{notice.text}</span>
          {notice.tone === "ok" && (
            <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
              <X size={16} />
            </button>
          )}
        </p>
      )}

      <TaxonomyForm
        key={`new-${reloadCount}`}
        config={config}
        submitLabel={`Add ${config.noun}`}
        onSubmit={async (input) => {
          const created = await run((token) => config.create(token, input));
          await afterChange(`Added "${created.name}".`);
        }}
      />

      {load.status === "error" ? (
        <div className="admin-card admin-inline-card">
          <p>{load.message}</p>
          <button type="button" className="button secondary" onClick={reload}>
            <RotateCcw size={16} />
            <span>Try again</span>
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap" aria-busy={load.status === "loading"}>
          <table className="admin-table admin-taxonomy-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Products</th>
                {config.hasAccentAndOrder && (
                  <th scope="col" className="numeric">
                    Order
                  </th>
                )}
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editingId === item.id ? (
                  <tr key={item.id} className="admin-taxonomy-editing">
                    <td colSpan={config.hasAccentAndOrder ? 4 : 3}>
                      <TaxonomyForm
                        config={config}
                        initial={toValues(item)}
                        submitLabel="Save"
                        onCancel={() => setEditingId(null)}
                        onSubmit={async (input) => {
                          await run((token) => config.update(token, item.id, input));
                          setEditingId(null);
                          await afterChange(`Saved "${input.name}".`);
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    <td>
                      <span className="admin-taxonomy-name">
                        {item.accent && (
                          <span className="admin-swatch" style={{ background: item.accent }} aria-hidden="true" />
                        )}
                        <span>
                          <strong>{item.name}</strong>
                          <small>/{item.slug}</small>
                        </span>
                      </span>
                    </td>
                    <td>{productSummary(item)}</td>
                    {config.hasAccentAndOrder && <td className="numeric">{item.sortOrder}</td>}
                    <td>
                      {confirmingId === item.id ? (
                        <div className="admin-confirm" role="group" aria-label={`Delete ${item.name}?`}>
                          <span>Delete?</span>
                          <button
                            type="button"
                            className="admin-danger-button"
                            disabled={busyId === item.id}
                            onClick={() => remove(item)}
                          >
                            {busyId === item.id ? "Deleting…" : "Delete"}
                          </button>
                          <button type="button" className="admin-link-button" onClick={() => setConfirmingId(null)}>
                            Keep
                          </button>
                        </div>
                      ) : (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            aria-label={`Edit ${item.name}`}
                            title="Edit"
                            onClick={() => {
                              setEditingId(item.id);
                              setConfirmingId(null);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${item.name}`}
                            title={
                              item.productCount > 0
                                ? `Move its ${countProducts(item.productCount)} first`
                                : "Delete"
                            }
                            disabled={item.productCount > 0}
                            onClick={() => {
                              setConfirmingId(item.id);
                              setEditingId(null);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          {load.status === "loading" && <p className="admin-empty">Loading…</p>}
          {load.status === "ready" && items.length === 0 && (
            <p className="admin-empty">Nothing here yet. Add the first one above.</p>
          )}
        </div>
      )}
    </section>
  );
}

type TaxonomyFormProps<T extends TaxonomyItem> = {
  config: TaxonomyConfig<T>;
  initial?: TaxonomyValues;
  submitLabel: string;
  onSubmit: (input: TaxonomyInput) => Promise<void>;
  onCancel?: () => void;
};

/** The add form above the table, and the edit form inside a row. */
function TaxonomyForm<T extends TaxonomyItem>(props: TaxonomyFormProps<T>) {
  const { config, initial, submitLabel, onSubmit, onCancel } = props;
  const id = useId();
  const [values, setValues] = useState(initial ?? emptyValues);
  // A new item's URL name follows its name until edited by hand.
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(field: keyof TaxonomyValues, value: string) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !slugEdited) next.slug = slugify(value);
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const result = toInput(values, config.hasAccentAndOrder);
    if (!result.input) {
      setErrors(result.errors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(result.input);
    } catch (error) {
      const problem = describeError(error, config.noun);
      setFormError(problem.message);
      if (problem.fields) setErrors(problem.fields);
    } finally {
      setSaving(false);
    }
  }

  const field = (name: keyof TaxonomyValues) => ({
    id: `${id}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined
  });
  const fieldError = (name: keyof TaxonomyValues) =>
    errors[name] && (
      <small id={`${id}-${name}-error`} className="admin-field-error">
        {errors[name]}
      </small>
    );

  return (
    <form
      className={initial ? "admin-taxonomy-form admin-taxonomy-form-inline" : "admin-taxonomy-form admin-panel"}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="admin-field" data-invalid={errors.name ? "" : undefined}>
        <label htmlFor={`${id}-name`}>Name</label>
        <input
          {...field("name")}
          value={values.name}
          maxLength={80}
          onChange={(event) => set("name", event.target.value)}
        />
        {fieldError("name")}
      </div>
      <div className="admin-field" data-invalid={errors.slug ? "" : undefined}>
        <label htmlFor={`${id}-slug`}>URL name</label>
        <input
          {...field("slug")}
          value={values.slug}
          maxLength={160}
          placeholder="made from the name"
          onChange={(event) => {
            setSlugEdited(true);
            set("slug", event.target.value);
          }}
        />
        {fieldError("slug")}
      </div>
      {config.hasAccentAndOrder && (
        <>
          <div className="admin-field admin-accent-field" data-invalid={errors.accent ? "" : undefined}>
            <label htmlFor={`${id}-accent`}>Tile colour</label>
            <span className="admin-color-input">
              <input
                type="color"
                aria-label="Pick a colour"
                value={HEX.test(values.accent) ? values.accent : DEFAULT_ACCENT}
                onChange={(event) => set("accent", event.target.value)}
              />
              <input
                {...field("accent")}
                value={values.accent}
                maxLength={7}
                onChange={(event) => set("accent", event.target.value)}
              />
            </span>
            {fieldError("accent")}
          </div>
          <div className="admin-field admin-order-field" data-invalid={errors.sortOrder ? "" : undefined}>
            <label htmlFor={`${id}-sortOrder`}>Order</label>
            <input
              {...field("sortOrder")}
              type="number"
              inputMode="numeric"
              step={1}
              value={values.sortOrder}
              onChange={(event) => set("sortOrder", event.target.value)}
            />
            {fieldError("sortOrder")}
          </div>
        </>
      )}
      <div className="admin-taxonomy-actions">
        <button type="submit" className="button primary" disabled={saving}>
          {initial ? <Check size={17} /> : <Plus size={17} />}
          <span>{saving ? "Saving…" : submitLabel}</span>
        </button>
        {onCancel && (
          <button type="button" className="button secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
      {formError && (
        <p className="admin-field-error admin-taxonomy-form-error" role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}
