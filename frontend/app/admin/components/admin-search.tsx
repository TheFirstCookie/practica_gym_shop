"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Box, CornerDownLeft, FolderTree, Receipt, Search, Tag } from "lucide-react";
import { listAdminBrands, listAdminCategories, listAdminOrders, listAdminProducts } from "@/lib/api/admin";
import type { AdminBrand, AdminCategory } from "@/lib/api/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { useAdminApi } from "../use-admin-api";
import { ORDER_STATUS_LABELS, orderNumber } from "./order-display";

type ResultGroup = "Go to" | "Orders" | "Products" | "Categories" | "Brands";

type Result = {
  key: string;
  group: ResultGroup;
  title: string;
  detail?: string;
  href: string;
};

const GROUP_ICONS = {
  "Go to": ArrowRight,
  Orders: Receipt,
  Products: Box,
  Categories: FolderTree,
  Brands: Tag
} satisfies Record<ResultGroup, unknown>;

// Pages you can jump to by typing their name.
const PAGES: Result[] = [
  { key: "p-dashboard", group: "Go to", title: "Dashboard", href: "/admin" },
  { key: "p-to-ship", group: "Go to", title: "Orders to ship", href: "/admin/orders" },
  { key: "p-awaiting", group: "Go to", title: "Orders awaiting payment", href: "/admin/orders?status=pending" },
  { key: "p-orders", group: "Go to", title: "All orders", href: "/admin/orders?status=all" },
  { key: "p-products", group: "Go to", title: "Products", href: "/admin/products" },
  { key: "p-new-product", group: "Go to", title: "New product", href: "/admin/products/new" },
  { key: "p-categories", group: "Go to", title: "Categories", href: "/admin/categories" },
  { key: "p-brands", group: "Go to", title: "Brands", href: "/admin/brands" }
];

const SEARCH_DEBOUNCE_MS = 200;
const PER_GROUP = 5;

const matches = (text: string, query: string) => text.toLowerCase().includes(query.toLowerCase());

/** True while the user is typing somewhere, so "/" doesn't hijack their text. */
function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

/**
 * Header search across orders (number, email, name), products, categories and brands, plus
 * quick links to admin pages. Opens with the button, Ctrl/Cmd + K, or "/".
 */
export function AdminSearch() {
  const router = useRouter();
  const { run } = useAdminApi();
  const listboxId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<{ query: string; results: Result[] } | null>(null);
  const [taxonomy, setTaxonomy] = useState<{ categories: AdminCategory[]; brands: AdminBrand[] } | null>(null);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);

  // Keyboard shortcuts to open the search from anywhere in the admin.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const shortcut = (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (shortcut || (event.key === "/" && !isTyping(event.target))) {
        event.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Drive the native <dialog>: modal, focus-trapped, closes on Escape.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Categories and brands are few: load them once and filter here.
  useEffect(() => {
    if (!open || taxonomy) return;
    Promise.all([run(listAdminCategories), run(listAdminBrands)])
      .then(([categories, brands]) => setTaxonomy({ categories, brands }))
      .catch(() => setFailed(true));
  }, [open, taxonomy, run]);

  // Orders and products are searched on the server, a moment after typing stops.
  const trimmed = query.trim();
  useEffect(() => {
    if (!open || trimmed.length < 2) return;
    let current = true;
    const timer = window.setTimeout(() => {
      const orderQuery = trimmed.replace(/^#/, "");
      Promise.all([
        run((token) => listAdminOrders(token, { status: "all", q: orderQuery, pageSize: PER_GROUP })),
        run((token) => listAdminProducts(token, { status: "all", q: trimmed, pageSize: PER_GROUP }))
      ])
        .then(([orders, products]) => {
          if (!current) return;
          setFailed(false);
          setRemote({
            query: trimmed,
            results: [
              ...orders.data.map((order) => ({
                key: `o-${order.id}`,
                group: "Orders" as const,
                title: `${orderNumber(order.id)} · ${order.customerName ?? order.customerEmail ?? "No customer yet"}`,
                detail: [
                  ORDER_STATUS_LABELS[order.status],
                  formatPrice(order.totalCents, order.currency),
                  formatDateTime(order.createdAt)
                ].join(" · "),
                href: `/admin/orders/${order.id}`
              })),
              ...products.data.map((product) => ({
                key: `pr-${product.id}`,
                group: "Products" as const,
                title: product.name,
                detail: [
                  product.brand.name,
                  formatPrice(product.priceCents, product.currency),
                  `${product.stock} in stock`,
                  ...(product.isActive ? [] : ["hidden"])
                ].join(" · "),
                href: `/admin/products/${product.id}`
              }))
            ]
          });
        })
        .catch(() => current && setFailed(true));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [open, trimmed, run]);

  // Nothing is listed until you type; results then pop in as they match.
  const pages = trimmed ? PAGES.filter((page) => matches(page.title, trimmed)) : [];
  const local: Result[] = trimmed
    ? [
        ...(taxonomy?.categories ?? [])
          .filter((category) => matches(category.name, trimmed) || matches(category.slug, trimmed))
          .slice(0, PER_GROUP)
          .map((category) => ({
            key: `c-${category.id}`,
            group: "Categories" as const,
            title: category.name,
            detail: `${category.productCount} ${category.productCount === 1 ? "product" : "products"}`,
            href: "/admin/categories"
          })),
        ...(taxonomy?.brands ?? [])
          .filter((brand) => matches(brand.name, trimmed) || matches(brand.slug, trimmed))
          .slice(0, PER_GROUP)
          .map((brand) => ({
            key: `b-${brand.id}`,
            group: "Brands" as const,
            title: brand.name,
            detail: `${brand.productCount} ${brand.productCount === 1 ? "product" : "products"}`,
            href: "/admin/brands"
          }))
      ]
    : [];
  const serverResults = trimmed.length >= 2 && remote?.query === trimmed ? remote.results : [];
  const searching = trimmed.length >= 2 && remote?.query !== trimmed && !failed;
  const results = [...serverResults, ...local, ...pages];
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function go(result: Result) {
    close();
    router.push(result.href);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + results.length) % results.length);
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex]);
    }
  }

  // Render the flat list with a heading before each group's first result.
  let previousGroup: ResultGroup | null = null;

  return (
    <>
      <button
        type="button"
        className="admin-search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search the admin"
      >
        <Search size={16} aria-hidden="true" />
        <span>Search orders, products…</span>
        <kbd>Ctrl K</kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="admin-search-dialog"
        aria-label="Search"
        onClose={close}
        onClick={(event) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="admin-search-panel">
          <div className="admin-search-top">
            <label className="admin-search-field">
              <Search size={18} aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-activedescendant={results[activeIndex] ? `${listboxId}-${results[activeIndex].key}` : undefined}
                aria-label="Search orders, products, categories and brands"
                placeholder="Order number, email, product, category…"
                value={query}
                maxLength={80}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
              />
            </label>
            <button type="button" className="admin-search-close" aria-label="Close search" onClick={close}>
              <kbd>Esc</kbd>
            </button>
          </div>

          <ul id={listboxId} role="listbox" aria-label="Results" className="admin-search-results">
            {results.map((result, index) => {
              const heading = result.group !== previousGroup ? result.group : null;
              previousGroup = result.group;
              const Icon = GROUP_ICONS[result.group];
              return (
                <li key={result.key} role="presentation">
                  {heading && (
                    <p className="admin-search-group" role="presentation">
                      {heading}
                    </p>
                  )}
                  <a
                    id={`${listboxId}-${result.key}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    href={result.href}
                    className="admin-search-result"
                    onMouseMove={() => setActive(index)}
                    onClick={(event) => {
                      event.preventDefault();
                      go(result);
                    }}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>
                      <strong>{result.title}</strong>
                      {result.detail && <small>{result.detail}</small>}
                    </span>
                    {index === activeIndex && (
                      <CornerDownLeft size={14} aria-hidden="true" className="admin-search-enter" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <p className="admin-search-status" aria-live="polite">
            {statusMessage({ query: trimmed, failed, searching, hasResults: results.length > 0 })}
          </p>
        </div>
      </dialog>
    </>
  );
}

/** The line under the results: a hint, progress, or why nothing is listed. */
function statusMessage({
  query,
  failed,
  searching,
  hasResults
}: {
  query: string;
  failed: boolean;
  searching: boolean;
  hasResults: boolean;
}) {
  if (failed) return "Search isn't reachable right now. The API may be waking up.";
  if (!query) return "Type an order number, email, product, category or brand.";
  if (searching) return hasResults ? "" : "Searching…";
  if (query.length === 1) return "Keep typing to search orders and products.";
  if (!hasResults) return `Nothing matches "${query}".`;
  return "";
}
