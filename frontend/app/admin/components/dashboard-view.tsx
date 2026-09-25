"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { getDashboard } from "@/lib/api/admin";
import type { Dashboard, DashboardDays } from "@/lib/api/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ProductImage } from "@/app/components/product-image";
import { useAdminApi } from "../use-admin-api";
import { OrderStatusBadge, orderNumber } from "./order-display";
import { RevenueChart } from "./revenue-chart";

const RANGES: { days: DashboardDays; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" }
];
const DEFAULT_DAYS: DashboardDays = 30;

function readDays(value: string | null): DashboardDays {
  return RANGES.find((range) => String(range.days) === value)?.days ?? DEFAULT_DAYS;
}

type Loaded = { key: string; dashboard: Dashboard } | { key: string; error: string };

export function DashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { run } = useAdminApi();
  const days = readDays(searchParams.get("days"));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${days}|${reloadCount}`;

  useEffect(() => {
    let current = true;
    run((token) => getDashboard(token, days))
      .then((dashboard) => current && setLoaded({ key: requestKey, dashboard }))
      .catch((error: Error) => current && setLoaded({ key: requestKey, error: error.message }));
    return () => {
      current = false;
    };
  }, [run, days, requestKey]);

  const loading = loaded?.key !== requestKey;
  // While another range loads, the previous numbers stay on screen (dimmed), not a blank page.
  const dashboard = loaded && "dashboard" in loaded ? loaded.dashboard : null;
  const error = loaded && "error" in loaded && !loading ? loaded.error : null;

  function selectDays(next: DashboardDays) {
    router.replace(next === DEFAULT_DAYS ? pathname : `${pathname}?days=${next}`, { scroll: false });
  }

  return (
    <section className="admin-section admin-dashboard">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
        <div className="admin-tabs" role="group" aria-label="Period">
          {RANGES.map((range) => (
            <button
              type="button"
              key={range.days}
              aria-pressed={days === range.days}
              onClick={() => selectDays(range.days)}
            >
              {range.label}
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
                Revenue per day
              </h2>
              <small>Paid orders, by the day they were paid (UTC)</small>
            </div>
            <RevenueChart daily={dashboard.daily} currency={dashboard.currency} />
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

/** "+12%" / "-8%" against the previous period, or nothing when there's no baseline. */
function Change({ current, previous, days }: { current: number; previous: number; days: number }) {
  if (previous === 0) {
    return <small className="admin-stat-note">No sales in the {days} days before</small>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <small className="admin-stat-change" data-direction={up ? "up" : "down"}>
      <Icon size={14} aria-hidden="true" />
      <span>
        {up ? "+" : ""}
        {change}% vs previous {days} days
      </span>
    </small>
  );
}

function DashboardStats({ dashboard }: { dashboard: Dashboard }) {
  const { sales, orders, days, currency } = dashboard;
  const price = (cents: number) => formatPrice(cents, currency);

  return (
    <div className="admin-stats">
      <div className="admin-stat admin-stat-hero">
        <span className="admin-stat-label">Revenue, last {days} days</span>
        <strong className="admin-stat-value">{price(sales.revenueCents)}</strong>
        <Change current={sales.revenueCents} previous={sales.previousRevenueCents} days={days} />
      </div>
      <div className="admin-stat">
        <span className="admin-stat-label">Paid orders</span>
        <strong className="admin-stat-value">{sales.orderCount}</strong>
        <small className="admin-stat-note">Average {price(sales.averageOrderCents)}</small>
      </div>
      <Link href="/admin/orders" className="admin-stat admin-stat-link" data-attention={orders.toShip > 0 || undefined}>
        <span className="admin-stat-label">To ship</span>
        <strong className="admin-stat-value">{orders.toShip}</strong>
        <small className="admin-stat-note">
          <span>{orders.toShip ? "Open the list" : "All caught up"}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </small>
      </Link>
      <div className="admin-stat">
        <span className="admin-stat-label">All-time revenue</span>
        <strong className="admin-stat-value">{price(sales.allTimeRevenueCents)}</strong>
        <small className="admin-stat-note">
          {orders.awaitingPayment} {orders.awaitingPayment === 1 ? "checkout" : "checkouts"} awaiting payment
        </small>
      </div>
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
        <small>Units sold, last {dashboard.days} days</small>
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
