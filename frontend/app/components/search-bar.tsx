"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { ArrowRight, LayoutGrid, Search, Tag, X } from "lucide-react";
import { getBrands, getCategories } from "@/lib/api/catalog";
import type { Brand, Category, ProductSummary } from "@/lib/api/types";
import { MAX_QUERY_LENGTH } from "@/lib/filters";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { useProductSuggestions } from "./use-product-suggestions";

const SUGGESTION_LIMIT = 5;
const TAXONOMY_LIMIT = 3;

type Option =
  | { kind: "product"; key: string; href: string; product: ProductSummary }
  | { kind: "category"; key: string; href: string; category: Category }
  | { kind: "brand"; key: string; href: string; brand: Brand }
  | { kind: "all"; key: string; href: string };

const matches = (text: string, query: string) => text.toLowerCase().includes(query.toLowerCase());

// Header search: nothing shows until you type, then matching products, categories and
// brands pop in as they're found, and Enter opens the full results page. Keyboard follows
// the combobox pattern: arrows move through the options, Enter picks one, Escape closes
// the panel, then clears.
export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Keep the box in step with the URL when the results page changes query.
  // Adjusting state during render (not in an effect) avoids a second paint with the old text.
  const [syncedQuery, setSyncedQuery] = useState(initialQuery);
  if (initialQuery !== syncedQuery) {
    setSyncedQuery(initialQuery);
    setValue(initialQuery);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!formRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // "/" (outside text fields) or Ctrl/Cmd + K jumps to the search box from anywhere.
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing =
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      const slash = event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey;
      const commandK = (event.key === "k" || event.key === "K") && (event.ctrlKey || event.metaKey);

      if (slash || commandK) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Categories and brands are few: load them once, the first time the box gets focus,
  // and match them here as you type. Search still works (products only) if this fails.
  const [taxonomy, setTaxonomy] = useState<{ categories: Category[]; brands: Brand[] } | null>(null);
  const taxonomyRequested = useRef(false);
  function loadTaxonomy() {
    if (taxonomyRequested.current) return;
    taxonomyRequested.current = true;
    Promise.all([getCategories(), getBrands()])
      .then(([categories, brands]) => setTaxonomy({ categories, brands }))
      .catch((error: unknown) => {
        taxonomyRequested.current = false;
        console.warn("Couldn't load categories and brands for search", error);
      });
  }

  const query = value.trim();
  const { products: suggestions, total, loading, failed } = useProductSuggestions(
    query,
    SUGGESTION_LIMIT
  );
  const resultsHref = `/search?q=${encodeURIComponent(query)}`;

  const categoryMatches = query
    ? (taxonomy?.categories ?? [])
        .filter((category) => matches(category.name, query))
        .slice(0, TAXONOMY_LIMIT)
    : [];
  const brandMatches = query
    ? (taxonomy?.brands ?? []).filter((brand) => matches(brand.name, query)).slice(0, TAXONOMY_LIMIT)
    : [];

  // Every selectable row in display order; "see all results" is always last.
  const options: Option[] = [
    ...suggestions.map((product) => ({
      kind: "product" as const,
      key: `p-${product.slug}`,
      href: `/product/${product.slug}`,
      product
    })),
    ...categoryMatches.map((category) => ({
      kind: "category" as const,
      key: `c-${category.slug}`,
      href: `/category/${category.slug}`,
      category
    })),
    ...brandMatches.map((brand) => ({
      kind: "brand" as const,
      key: `b-${brand.slug}`,
      href: `/search?brand=${encodeURIComponent(brand.slug)}`,
      brand
    })),
    { kind: "all", key: "all", href: resultsHref }
  ];
  const optionCount = options.length;
  const matchCount = options.length - 1;
  // Nothing shows until something matches (or the search finishes empty-handed), so the
  // panel never flashes open with just a "Searching…" line.
  const showPanel = open && query.length > 0 && (matchCount > 0 || !loading);
  const optionId = (index: number) => `${listId}-option-${index}`;

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query) {
      inputRef.current?.focus();
      return;
    }

    close();
    // Drops the on-screen keyboard on phones.
    inputRef.current?.blur();
    router.push(resultsHref);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!query) {
        return;
      }

      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setOpen(true);
      // -1 means "back in the input", so the cycle is input -> options -> input.
      setActive((current) => {
        const next = current + step;
        if (next < -1) return optionCount - 1;
        if (next >= optionCount) return -1;
        return next;
      });
      return;
    }

    if (event.key === "Enter" && showPanel && active >= 0 && active < optionCount) {
      event.preventDefault();
      close();
      inputRef.current?.blur();
      router.push(options[active].href);
      return;
    }

    if (event.key === "Escape") {
      if (showPanel) {
        // Search inputs clear themselves on Escape; the first press should only close the panel.
        event.preventDefault();
        close();
      } else if (value) {
        setValue("");
      }
    }
  }

  return (
    <form
      ref={formRef}
      className="site-search"
      role="search"
      action="/search"
      onSubmit={handleSubmit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          close();
        }
      }}
    >
      <div className="site-search-field">
        <Search size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          id="site-search"
          type="search"
          name="q"
          value={value}
          maxLength={MAX_QUERY_LENGTH}
          placeholder="Search equipment"
          aria-label="Search products"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            setOpen(true);
            loadTaxonomy();
          }}
          onKeyDown={handleKeyDown}
        />
        {value ? (
          <button
            type="button"
            className="site-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              setActive(-1);
              inputRef.current?.focus();
            }}
          >
            <X size={16} strokeWidth={2.6} />
          </button>
        ) : (
          <kbd aria-hidden="true">/</kbd>
        )}
      </div>

      {showPanel && (
        // preventDefault keeps focus in the input, so clicking an option
        // doesn't blur the form and close the panel before the click lands.
        <div className="search-panel" onMouseDown={(event) => event.preventDefault()}>
          <div className="dropdown-panel">
            <p className="eyebrow" aria-live="polite">
              {suggestionHeading({ loading, failed, total, otherMatches: matchCount - suggestions.length })}
            </p>
            <ul id={listId} role="listbox" aria-label="Search suggestions">
              {options.map((option, index) => {
                // A small heading above the first category and the first brand.
                const previous = options[index - 1];
                const heading =
                  (option.kind === "category" || option.kind === "brand") && previous?.kind !== option.kind
                    ? option.kind === "category"
                      ? "Categories"
                      : "Brands"
                    : null;
                const common = {
                  id: optionId(index),
                  role: "option" as const,
                  "aria-selected": active === index,
                  tabIndex: -1,
                  onMouseEnter: () => setActive(index)
                };

                return (
                  <li key={option.key} role="presentation">
                    {heading && (
                      <p className="search-group" role="presentation">
                        {heading}
                      </p>
                    )}
                    {option.kind === "product" && (
                      <Link href={option.href} className="search-suggestion" onClick={close} {...common}>
                        <span className="search-suggestion-image">
                          <ProductImage src={option.product.image} alt="" />
                        </span>
                        <span>
                          <strong>{option.product.name}</strong>
                          <small>
                            {option.product.brand.name} - {option.product.category.name}
                          </small>
                        </span>
                        <span className="search-suggestion-price">
                          {formatPrice(option.product.priceCents, option.product.currency)}
                        </span>
                      </Link>
                    )}
                    {option.kind === "category" && (
                      <Link
                        href={option.href}
                        className="search-suggestion search-suggestion-compact"
                        onClick={close}
                        {...common}
                      >
                        <span
                          className="search-suggestion-icon"
                          style={{ "--accent": option.category.accent } as React.CSSProperties}
                        >
                          <LayoutGrid size={16} aria-hidden="true" />
                        </span>
                        <span>
                          <strong>{option.category.name}</strong>
                          <small>
                            {option.category.count} {option.category.count === 1 ? "product" : "products"}
                          </small>
                        </span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    )}
                    {option.kind === "brand" && (
                      <Link
                        href={option.href}
                        className="search-suggestion search-suggestion-compact"
                        onClick={close}
                        {...common}
                      >
                        <span className="search-suggestion-icon">
                          <Tag size={16} aria-hidden="true" />
                        </span>
                        <span>
                          <strong>{option.brand.name}</strong>
                          <small>Shop the brand</small>
                        </span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    )}
                    {option.kind === "all" && (
                      <Link
                        href={option.href}
                        className="dropdown-footer"
                        onClick={() => {
                          close();
                          inputRef.current?.blur();
                        }}
                        {...common}
                      >
                        <span>See all results for &ldquo;{query}&rdquo;</span>
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </form>
  );
}

function suggestionHeading({
  loading,
  failed,
  total,
  otherMatches
}: {
  loading: boolean;
  failed: boolean;
  total: number;
  /** Matching categories and brands, which are found instantly. */
  otherMatches: number;
}) {
  // Older results stay listed while new ones load, so only say "Searching" over an empty list.
  if (loading && total === 0) return "Searching products…";
  if (failed) {
    return otherMatches ? "Product search is unavailable right now" : "Search is unavailable right now";
  }
  if (total === 0) return otherMatches ? "No matching products" : "No matches";
  return `${total} ${total === 1 ? "product" : "products"}`;
}
