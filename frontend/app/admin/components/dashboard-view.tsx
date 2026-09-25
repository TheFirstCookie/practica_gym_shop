"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { getDashboard } from "@/lib/api/admin";
import type { Dashboard, DashboardRange } from "@/lib/api/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ProductImage } from "@/app/components/product-image";
import { useAdminApi } from "../use-admin-api";
import { OrderStatusBadge, orderNumber } from "./order-display";
import { RevenueChart } from "./revenue-chart";

const RANGES: { range: DashboardRange; label: string }[] = [
  { range: 7, label: "7 days" },
  { range: 30, label: "30 days" },
  { range: 90, label: "90 days" },
  { range: "all", label: "All time" }
];
const DEFAULT_RANGE: DashboardRange = 30;

function readRange(value: string | null): DashboardRange {
  return RANGES.find((option) => String(option.range) === value)?.range ?? DEFAULT_RANGE;
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

/** "2026-08-27" (a UTC day from the API) -> "Aug 27, 2026". */
const formatDay = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`));

/** "Last 30 days" / "All time", for headings and labels. */
function periodLabel(dashboard: Dashboard) {
  return dashboard.range === "all" ? "All time" : `Last ${dashboard.range} days`;
}

type Loaded = { key: string; dashboard: Dashboard } | { key: string; error: string };

export function DashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { run } = useAdminApi();
  const range = readRange(searchParams.get("days"));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${range}|${reloadCount}`;

  useEffect(() => {
    let current = true;
    run((token) => getDashboard(token, range))
      .then((dashboard) => current && setLoaded({ key: requestKey, dashboard }))
      .catch((error: Error) => current && setLoaded({ key: requestKey, error: error.message }));
    return () => {
      current = false;
    };
  }, [run, range, requestKey]);

  const loading = loaded?.key !== requestKey;
  // While another range loads, the previous numbers stay on screen (dimmed), not a blank page.
  const dashboard = loaded && "dashboard" in loaded ? loaded.dashboard : null;
  const error = loaded && "error" in loaded && !loading ? loaded.error : null;

  function selectRange(next: DashboardRange) {
    router.replace(next === DEFAULT_RANGE ? pathname : `${pathname}?days=${next}`, { scroll: false });
  }

  return (
    <section className="admin-section admin-dashboard">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
        <div className="admin-tabs" role="group" aria-label="Period">
          {RANGES.map((option) => (
            <button
              type="button"
              key={option.range}
              aria-pressed={range === option.range}
              onClick={() => selectRange(option.range)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="admin-card admin-inline-card">
          <p>{error}</p>
          <button type="button" className="button secondary" onClick={() => setReloadCount((count) => count + 1)}>
            <RotateCcw size={16} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {!dashboard && !error && <p className="admin-status">Loading…</p>}

      {dashboard && (
        <div className="admin-dashboard-body" aria-busy={loading} data-stale={loading || undefined}>
          <DashboardStats dashboard={dashboard} />

          <section className="admin-panel admin-dashboard-chart" aria-labelledby="revenue-heading">
            <div className="admin-panel-heading">
              <h2 id="revenue-heading" className="admin-panel-title">
                Revenue per {dashboard.bucket}
              </h2>
              <small>
                Paid orders, by the {dashboard.bucket} they were paid (UTC), since{" "}
                {formatDay(dashboard.since)}
              </small>
            </div>
            <RevenueChart series={dashboard.series} bucket={dashboard.bucket} currency={dashboard.currency} />
          </section>

          <div className="admin-dashboard-columns">
            <TopProducts dashboard={dashboard} />
            <LowStock dashboard={dashboard} />
          </div>

          <RecentOrders dashboard={dashboard} />
        </div>
      )}
    </section>
  );
}

/** "+12%" / "-8%" against the previous period of the same length. */
function Change({ current, previous, dashboard }: { current: number; previous: number | null; dashboard: Dashboard }) {
  if (previous === null) {
    return <small className="admin-stat-note">Since {formatDay(dashboard.since)}</small>;
  }
  if (previous === 0) {
    return <small className="admin-stat-note">Nothing in the {dashboard.days} days before</small>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <small className="admin-stat-change" data-direction={up ? "up" : "down"}>
      <Icon size={13} aria-hidden="true" />
      <span>
        {up ? "+" : ""}
        {change}% vs previous {dashboard.days} days
      </span>
    </small>
  );
}

function DashboardStats({ dashboard }: { dashboard: Dashboard }) {
  const { sales, orders, currency } = dashboard;
  const price = (cents: number) => formatPrice(cents, currency);

  return (
    <div className="admin-stats">
      <div className="admin-stat admin-stat-accent">
        <span className="admin-stat-label">Revenue</span>
        <strong className="admin-stat-value">{price(sales.revenueCents)}</strong>
        <Change current={sales.revenueCents} previous={sales.previousRevenueCents} dashboard={dashboard} />
      </div>
      <div className="admin-stat">
        <span className="admin-stat-label">Paid orders</span>
        <strong className="admin-stat-value">{sales.orderCount}</strong>
        <Change current={sales.orderCount} previous={sales.previousOrderCount} dashboard={dashboard} />
      </div>
      <div className="admin-stat">
        <span className="admin-stat-label">Average order</span>
        <strong className="admin-stat-value">{price(sales.averageOrderCents)}</strong>
        <small className="admin-stat-note">{periodLabel(dashboard)}</small>
      </div>
      <Link href="/admin/orders" className="admin-stat admin-stat-link" data-attention={orders.toShip > 0 || undefined}>
        <span className="admin-stat-label">To ship</span>
        <strong className="admin-stat-value">{orders.toShip}</strong>
        <small className="admin-stat-note">
          <span>{orders.toShip ? "Open the list" : "All caught up"}</span>
          <ArrowRight size={13} aria-hidden="true" />
        </small>
      </Link>
      <Link href="/admin/orders?status=pending" className="admin-stat admin-stat-link">
        <span className="admin-stat-label">Awaiting payment</span>
        <strong className="admin-stat-value">{orders.awaitingPayment}</strong>
        <small className="admin-stat-note">Open checkouts on Stripe</small>
      </Link>
    </div>
  );
}

function TopProducts({ dashboard }: { dashboard: Dashboard }) {
  const best = dashboard.topProducts[0]?.units ?? 0;

  return (
    <section className="admin-panel" aria-labelledby="top-products-heading">
      <div className="admin-panel-heading">
        <h2 id="top-products-heading" className="admin-panel-title">
          Best sellers
        </h2>
        <small>Units sold, {periodLabel(dashboard).toLowerCase()}</small>
      </div>
      {dashboard.topProducts.length === 0 ? (
        <p className="admin-hint">No sales in this period yet.</p>
      ) : (
        <ol className="admin-rank-list">
          {dashboard.topProducts.map((product) => (
            <li key={product.productId ?? product.name}>
              <span className="admin-rank-name">
                {product.productId ? (
                  <Link href={`/admin/products/${product.productId}`}>{product.name}</Link>
                ) : (
                  product.name
                )}
              </span>
              <span className="admin-rank-value">
                <strong>{product.units}</strong> sold · {formatPrice(product.revenueCents, dashboard.currency)}
              </span>
              {/* A thin bar: units relative to the best seller. */}
              <span className="admin-rank-meter" aria-hidden="true">
                <span style={{ width: `${best ? (product.units / best) * 100 : 0}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LowStock({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="admin-panel" aria-labelledby="low-stock-heading">
      <div className="admin-panel-heading">
        <h2 id="low-stock-heading" className="admin-panel-title">
          Low stock
        </h2>
        <small>In the shop with {dashboard.lowStockThreshold} or fewer left</small>
      </div>
      {dashboard.lowStock.length === 0 ? (
        <p className="admin-hint">Everything is well stocked.</p>
      ) : (
        <ul className="admin-stock-list">
          {dashboard.lowStock.map((product) => (
            <li key={product.id}>
              <Link href={`/admin/products/${product.id}`} className="admin-product-cell">
                <span className="admin-thumb">
                  <ProductImage src={product.image} alt="" />
                </span>
                <strong>{product.name}</strong>
              </Link>
              <span className="admin-stock-count" data-out={product.stock === 0 || undefined}>
                {product.stock === 0 ? "Sold out" : `${product.stock} left`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentOrders({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="admin-panel" aria-labelledby="recent-orders-heading">
      <div className="admin-panel-heading">
        <h2 id="recent-orders-heading" className="admin-panel-title">
          Recent orders
        </h2>
        <Link href="/admin/orders?status=all" className="admin-external-link">
          <span>All orders</span>
          <ArrowRight size={15} />
        </Link>
      </div>
      {dashboard.recentOrders.length === 0 ? (
        <p className="admin-hint">No paid orders yet. Test checkout with the card 4242 4242 4242 4242.</p>
      ) : (
        <div className="admin-table-wrap admin-table-flat">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col" className="numeric">
                  Total
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentOrders.map((order) => (
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
                      <small>{order.customerEmail ?? ""}</small>
                    </span>
                  </td>
                  <td className="numeric">{formatPrice(order.totalCents, order.currency)}</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
