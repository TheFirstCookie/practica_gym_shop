"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, RotateCcw, Search, X } from "lucide-react";
import {
  archiveProduct,
  listAdminProducts,
  updateProduct,
  type AdminProductStatus
} from "@/lib/api/admin";
import type { AdminProduct, ProductList } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/app/components/product-image";
import { useAdminApi } from "../use-admin-api";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_TABS: { value: AdminProductStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "In the shop" },
  { value: "inactive", label: "Hidden" }
];

const NOTICES: Record<string, string> = {
  created: "Product created. It's live in the shop.",
  updated: "Changes saved."
};

type Loaded = { key: string; list: ProductList<AdminProduct> } | { key: string; error: string };

function readStatus(value: string | null): AdminProductStatus {
  return value === "active" || value === "inactive" ? value : "all";
}

export function ProductTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { run, refreshShop } = useAdminApi();

  const q = searchParams.get("q") ?? "";
  const status = readStatus(searchParams.get("status"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const notice = NOTICES[searchParams.get("notice") ?? ""];

  const [draft, setDraft] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Back/forward can change ?q= under us; keep the search box in step with the URL.
  if (q !== syncedQ) {
    setSyncedQ(q);
    setDraft(q);
  }

  const requestKey = `${q}|${status}|${page}|${reloadCount}`;

  function setParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("notice");
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Typing updates the URL after a short pause, which triggers the fetch below.
  const searchTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  function handleSearchInput(value: string) {
    setDraft(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(
      () => setParams({ q: value.trim() || null, page: null }),
      SEARCH_DEBOUNCE_MS
    );
  }

  useEffect(() => {
    let current = true;

    run((token) => listAdminProducts(token, { q: q || undefined, status, page, pageSize: PAGE_SIZE }))
      .then((list) => current && setLoaded({ key: requestKey, list }))
      .catch((error: Error) => current && setLoaded({ key: requestKey, error: error.message }));

    return () => {
      current = false;
    };
  }, [run, requestKey, q, status, page]);

  async function setVisibility(product: AdminProduct, visible: boolean) {
    setBusyId(product.id);
    setActionError(null);
    try {
      await run<unknown>((token) =>
        visible ? updateProduct(token, product.id, { isActive: true }) : archiveProduct(token, product.id)
      );
      await refreshShop();
      setReloadCount((count) => count + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "That didn't work");
    } finally {
      setBusyId(null);
    }
  }

  const loading = loaded?.key !== requestKey;
  const list = loaded && "list" in loaded ? loaded.list : null;
  const loadError = loaded && "error" in loaded && !loading ? loaded.error : null;

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
        </div>
        <Link href="/admin/products/new" className="button primary">
          <Plus size={18} />
          <span>New product</span>
        </Link>
      </div>

      {notice && (
        <p className="admin-notice" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setParams({})}>
            <X size={16} />
          </button>
        </p>
      )}
      {actionError && (
        <p className="admin-error" role="alert">
          {actionError}
        </p>
      )}

      <div className="admin-toolbar">
        <label className="admin-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, brand or description"
            aria-label="Search products"
            value={draft}
            maxLength={80}
            onChange={(event) => handleSearchInput(event.target.value)}
          />
        </label>
        <div className="admin-tabs" role="group" aria-label="Show">
          {STATUS_TABS.map((tab) => (
            <button
              type="button"
              key={tab.value}
              aria-pressed={status === tab.value}
              onClick={() => setParams({ status: tab.value === "all" ? null : tab.value, page: null })}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <div className="admin-card admin-inline-card">
          <p>{loadError}</p>
          <button type="button" className="button secondary" onClick={() => setReloadCount((c) => c + 1)}>
            <RotateCcw size={16} />
            <span>Try again</span>
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap" aria-busy={loading}>
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Brand</th>
                <th scope="col" className="numeric">Price</th>
                <th scope="col" className="numeric">Stock</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list?.data.map((product) => (
                <tr key={product.id} data-hidden={!product.isActive || undefined}>
                  <td>
                    <Link href={`/admin/products/${product.id}`} className="admin-product-cell">
                      <span className="admin-thumb">
                        <ProductImage src={product.image} alt="" />
                      </span>
                      <span>
                        <strong>{product.name}</strong>
                        <small>/{product.slug}</small>
                      </span>
                    </Link>
                  </td>
                  <td>{product.category.name}</td>
                  <td>{product.brand.name}</td>
                  <td className="numeric">{formatPrice(product.priceCents, product.currency)}</td>
                  <td className="numeric" data-low={product.stock <= 5 || undefined}>
                    {product.stock}
                  </td>
                  <td>
                    <span className="admin-badge" data-active={product.isActive}>
                      {product.isActive ? "In shop" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`}>
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        aria-label={product.isActive ? `Hide ${product.name}` : `Show ${product.name}`}
                        title={product.isActive ? "Hide from the shop" : "Show in the shop"}
                        onClick={() => setVisibility(product, !product.isActive)}
                      >
                        {product.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {list && list.data.length === 0 && (
            <p className="admin-empty">
              {q ? `No products match "${q}".` : "No products here yet."}
            </p>
          )}
          {!list && <p className="admin-empty">Loading products…</p>}
        </div>
      )}

      {list && list.meta.pagination.totalPages > 1 && (
        <div className="admin-pager">
          <button
            type="button"
            className="button secondary"
            disabled={page <= 1}
            onClick={() => setParams({ page: page > 2 ? String(page - 1) : null })}
          >
            Previous
          </button>
          <span>
            Page {page} of {list.meta.pagination.totalPages} · {list.meta.pagination.total} products
          </span>
          <button
            type="button"
            className="button secondary"
            disabled={page >= list.meta.pagination.totalPages}
            onClick={() => setParams({ page: String(page + 1) })}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
