"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { MAX_QUERY_LENGTH, formatPrice, products, searchProducts } from "@/lib/catalog";

const SUGGESTION_LIMIT = 5;

// Header search: suggests products while typing, and Enter opens the full
// results page. Keyboard follows the combobox pattern: arrows move through
// the options, Enter picks one, Escape closes the panel, then clears.
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

  // "/" jumps to the search box from anywhere that isn't already a text field.
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing =
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const query = value.trim();
  const matches = query ? searchProducts(products, query) : [];
  const suggestions = matches.slice(0, SUGGESTION_LIMIT);
  const showPanel = open && query.length > 0;
  // The "see all results" row is the last option.
  const optionCount = suggestions.length + 1;
  const resultsHref = `/search?q=${encodeURIComponent(query)}`;
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

    if (event.key === "Enter" && showPanel && active >= 0 && active < suggestions.length) {
      event.preventDefault();
      close();
      router.push(`/product/${suggestions[active].slug}`);
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
          onFocus={() => setOpen(true)}
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
            <p className="eyebrow">
              {matches.length > 0
                ? `${matches.length} ${matches.length === 1 ? "product" : "products"}`
                : "No matching products"}
            </p>
            <ul id={listId} role="listbox" aria-label="Search suggestions">
              {suggestions.map((product, index) => (
                <li key={product.slug} role="presentation">
                  <Link
                    href={`/product/${product.slug}`}
                    id={optionId(index)}
                    className="search-suggestion"
                    role="option"
                    aria-selected={active === index}
                    tabIndex={-1}
                    onMouseEnter={() => setActive(index)}
                    onClick={close}
                  >
                    <img src={product.image} alt="" />
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {product.brand} - {product.category}
                      </small>
                    </span>
                    <span className="search-suggestion-price">{formatPrice(product.price)}</span>
                  </Link>
                </li>
              ))}
              <li role="presentation">
                <Link
                  href={resultsHref}
                  id={optionId(suggestions.length)}
                  className="dropdown-footer"
                  role="option"
                  aria-selected={active === suggestions.length}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(suggestions.length)}
                  onClick={() => {
                    close();
                    inputRef.current?.blur();
                  }}
                >
                  <span>See all results for &ldquo;{query}&rdquo;</span>
                  <ArrowRight size={16} />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </form>
  );
}
