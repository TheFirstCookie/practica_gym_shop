"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { MAX_VARIANTS, moveRow, newVariantRow, type VariantErrors, type VariantFormRow } from "./variant-form-values";

type VariantEditorProps = {
  rows: VariantFormRow[];
  errors: VariantErrors;
  onChange: (rows: VariantFormRow[]) => void;
  /** The product's own price and stock: the first row starts from them. */
  defaultPrice: string;
  defaultStock: string;
};

/**
 * The weights, sizes or colours a product comes in, each with its own price and stock.
 * The order here is the order shoppers see. No rows: a plain product.
 */
export function VariantEditor({ rows, errors, onChange, defaultPrice, defaultStock }: VariantEditorProps) {
  function update(key: string, change: Partial<VariantFormRow>) {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...change } : row)));
  }

  return (
    <fieldset className="admin-panel admin-variants">
      <legend>Variants</legend>
      <p className="admin-hint">
        {rows.length === 0
          ? "Sold in several weights, sizes or colours? Add each one with its own price and stock. Shoppers pick one on the product page."
          : "Shoppers pick one of these on the product page, in this order. Untick “On sale” to hide one without losing its history."}
      </p>

      {rows.length > 0 && (
        <div className="admin-variant-list" role="list">
          <div className="admin-variant-head" aria-hidden="true">
            <span>Name</span>
            <span>Price (USD)</span>
            <span>Stock</span>
            <span>On sale</span>
          </div>
          {rows.map((row, index) => {
            const rowErrors = errors[row.key] ?? {};
            const label = row.name.trim() || `Variant ${index + 1}`;
            return (
              <div className="admin-variant-row" role="listitem" key={row.key} data-hidden={!row.isActive || undefined}>
                <VariantInput
                  column="Name"
                  label={`${label}: name`}
                  error={rowErrors.name}
                  value={row.name}
                  maxLength={60}
                  placeholder="20 kg"
                  onChange={(name) => update(row.key, { name })}
                />
                <VariantInput
                  column="Price (USD)"
                  label={`${label}: price`}
                  error={rowErrors.price}
                  value={row.price}
                  inputMode="decimal"
                  placeholder="49.99"
                  onChange={(price) => update(row.key, { price })}
                />
                <VariantInput
                  column="Stock"
                  label={`${label}: stock`}
                  error={rowErrors.stock}
                  value={row.stock}
                  type="number"
                  onChange={(stock) => update(row.key, { stock })}
                />
                <label className="admin-variant-check" data-label="On sale">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(event) => update(row.key, { isActive: event.target.checked })}
                  />
                  <span className="visually-hidden">{label}: on sale</span>
                </label>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => onChange(moveRow(rows, index, -1))}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${label} down`}
                    disabled={index === rows.length - 1}
                    onClick={() => onChange(moveRow(rows, index, 1))}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${label}`}
                    onClick={() => onChange(rows.filter((item) => item.key !== row.key))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="button secondary admin-variant-add"
        disabled={rows.length >= MAX_VARIANTS}
        onClick={() => {
          const last = rows.at(-1);
          onChange([...rows, last ? newVariantRow(last.price) : newVariantRow(defaultPrice, defaultStock)]);
        }}
      >
        <Plus size={16} />
        <span>{rows.length === 0 ? "Add variants" : "Add another"}</span>
      </button>
    </fieldset>
  );
}

type VariantInputProps = {
  /** Column name, shown above the field on phones where the header row is hidden. */
  column: string;
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

function VariantInput({ column, label, error, value, onChange, ...props }: VariantInputProps) {
  return (
    <label className="admin-field admin-variant-field" data-label={column} data-invalid={error ? true : undefined}>
      <span className="visually-hidden">{label}</span>
      <input
        {...props}
        value={value}
        min={props.type === "number" ? 0 : undefined}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <small className="admin-field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
