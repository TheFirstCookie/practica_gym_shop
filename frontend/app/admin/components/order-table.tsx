"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, RotateCcw, Search, Truck, X } from "lucide-react";
import { listAdminOrders, updateOrderStatus } from "@/lib/api/admin";
import type { AdminOrderList, AdminOrderSummary, OrderStatus } from "@/lib/api/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { useAdminApi } from "../use-admin-api";
import { OrderStatusBadge, orderNumber } from "./order-display";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type StatusFilter = OrderStatus | "all";

// "To ship" comes first and is the default: it's the list that needs work.
const DEFAULT_STATUS: StatusFilter = "paid";
const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "paid", label: "To ship" },
  { value: "fulfilled", label: "Shipped" },
  { value: "pending", label: "Awaiting payment" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "all", label: "All" }
];

type Loaded = { key: string; list: AdminOrderList } | { key: string; error: string };

function readStatus(value: string | null): StatusFilter {
  return STATUS_TABS.find((tab) => tab.value === value)?.value ?? DEFAULT_STATUS;
}

/** People paste order numbers as shown ("#57AB6234"); the API matches the bare id. */
function toApiQuery(q: string) {
  return q.replace(/^#/, "").trim() || undefined;
}

export function OrderTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { run } = useAdminApi();

  const q = searchParams.get("q") ?? "";
  const status = readStatus(searchParams.get("status"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [draft, setDraft] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // The order just marked as shipped, so the notice can offer an undo.
  const [shipped, setShipped] = useState<AdminOrderSummary | null>(null);

  // Back/forward can change ?q= under us; keep the search box in step with the URL.
  if (q !== syncedQ) {
    setSyncedQ(q);
    setDraft(q);
  }

  const requestKey = `${q}|${status}|${page}|${reloadCount}`;

  function setParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
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

    run((token) => listAdminOrders(token, { status, q: toApiQuery(q), page, pageSize: PAGE_SIZE }))
      .then((list) => current && setLoaded({ key: requestKey, list }))
      .catch((error: Error) => current && setLoaded({ key: requestKey, error: error.message }));

    return () => {
      current = false;
    };
  }, [run, requestKey, q, status, page]);

  async function changeStatus(order: AdminOrderSummary, next: "fulfilled" | "paid") {
    setBusyId(order.id);
    setActionError(null);
    try {
      await run((token) => updateOrderStatus(token, order.id, next));
      setShipped(next === "fulfilled" ? order : null);
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
  const counts = list?.meta.counts;

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Orders</h1>
        </div>
      </div>

      {shipped && (
        <p className="admin-notice" role="status">
          <span>Order {orderNumber(shipped.id)} marked as shipped.</span>
          <span className="admin-notice-actions">
            <button
              type="button"
              className="admin-link-button"
              disabled={busyId === shipped.id}
              onClick={() => changeStatus(shipped, "paid")}
            >
              Undo
            </button>
            <button type="button" aria-label="Dismiss" onClick={() => setShipped(null)}>
              <X size={16} />
            </button>
          </span>
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
            placeholder="Search by email, name or order number"
            aria-label="Search orders"
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
              onClick={() => setParams({ status: tab.value === DEFAULT_STATUS ? null : tab.value, page: null })}
            >
              {tab.label}
              {counts && <span className="admin-tab-count">{counts[tab.value]}</span>}
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
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col" className="numeric">Items</th>
                <th scope="col" className="numeric">Total</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list?.data.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="admin-order-cell">
                      <strong>{orderNumber(order.id)}</strong>
                      <small>{formatDateTime(order.createdAt)}</small>
                    </Link>
                  </td>
                  <td>
                    <span className="admin-order-customer">
                      <span>{order.customerName ?? "—"}</span>
                      <small>{order.customerEmail ?? "Not given yet"}</small>
                    </span>
                  </td>
                  <td className="numeric">{order.itemCount}</td>
                  <td className="numeric">{formatPrice(order.totalCents, order.currency)}</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {order.status === "paid" && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          aria-label={`Mark order ${orderNumber(order.id)} as shipped`}
                          title="Mark as shipped"
                          onClick={() => changeStatus(order, "fulfilled")}
                        >
                          <Truck size={16} />
                        </button>
                      )}
                      <Link href={`/admin/orders/${order.id}`} aria-label={`Open order ${orderNumber(order.id)}`}>
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {list && list.data.length === 0 && (
            <p className="admin-empty">
              {q ? `No orders match "${q}".` : status === "paid" ? "Nothing to ship right now." : "No orders here yet."}
            </p>
          )}
          {!list && <p className="admin-empty">Loading orders…</p>}
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
            Page {page} of {list.meta.pagination.totalPages} · {list.meta.pagination.total} orders
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
