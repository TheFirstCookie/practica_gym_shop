"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Copy, RotateCcw, Truck, Undo2 } from "lucide-react";
import { getAdminOrder, updateOrderStatus, type ManualOrderStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminOrder } from "@/lib/api/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { useAdminApi } from "../use-admin-api";
import { addressLines, OrderStatusBadge, orderNumber } from "./order-display";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; order: AdminOrder };

export function OrderDetail({ orderId }: { orderId: string }) {
  const { run } = useAdminApi();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;

    run((token) => getAdminOrder(token, orderId))
      .then((order) => current && setLoad({ status: "ready", order }))
      .catch((error: unknown) => {
        if (!current) return;
        const message =
          error instanceof ApiError && (error.isNotFound || error.code === "validation_error")
            ? "This order doesn't exist."
            : error instanceof Error
              ? error.message
              : "Couldn't load the order";
        setLoad({ status: "error", message });
      });

    return () => {
      current = false;
    };
  }, [run, orderId, attempt]);

  return (
    <section className="admin-section admin-editor">
      <Link href="/admin/orders" className="admin-back-link">
        <ArrowLeft size={15} />
        <span>All orders</span>
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
        <OrderView order={load.order} onChange={(order) => setLoad({ status: "ready", order })} />
      )}
    </section>
  );
}

type OrderViewProps = {
  order: AdminOrder;
  onChange: (order: AdminOrder) => void;
};

function OrderView({ order, onChange }: OrderViewProps) {
  const { run } = useAdminApi();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = (cents: number) => formatPrice(cents, order.currency);

  async function changeStatus(status: ManualOrderStatus) {
    setSaving(true);
    setError(null);
    try {
      onChange(await run((token) => updateOrderStatus(token, order.id, status)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That didn't work");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-order">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Order</p>
          <h1>{orderNumber(order.id)}</h1>
        </div>
        <div className="admin-order-actions">
          <OrderStatusBadge status={order.status} />
          {order.status === "paid" && (
            <button type="button" className="button primary" disabled={saving} onClick={() => changeStatus("fulfilled")}>
              <Truck size={18} />
              <span>{saving ? "Saving…" : "Mark as shipped"}</span>
            </button>
          )}
          {order.status === "fulfilled" && (
            <button type="button" className="button secondary" disabled={saving} onClick={() => changeStatus("paid")}>
              <Undo2 size={17} />
              <span>{saving ? "Saving…" : "Not shipped yet"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <StatusNote order={order} />

      <div className="admin-order-grid">
        <section className="admin-panel" aria-labelledby="order-items-heading">
          <h2 id="order-items-heading" className="admin-panel-title">
            Items
          </h2>
          <table className="admin-order-items">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className="numeric">Price</th>
                <th scope="col" className="numeric">Qty</th>
                <th scope="col" className="numeric">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.productId ? (
                      <Link href={`/admin/products/${item.productId}`}>{item.name}</Link>
                    ) : (
                      <span title="This product was deleted">{item.name}</span>
                    )}
                  </td>
                  <td className="numeric">{price(item.unitPriceCents)}</td>
                  <td className="numeric">{item.quantity}</td>
                  <td className="numeric">{price(item.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {order.subtotalCents !== order.totalCents && (
                <tr>
                  <th scope="row" colSpan={3}>
                    Subtotal
                  </th>
                  <td className="numeric">{price(order.subtotalCents)}</td>
                </tr>
              )}
              <tr className="admin-order-total">
                <th scope="row" colSpan={3}>
                  Total paid
                </th>
                <td className="numeric">{price(order.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <div className="admin-form-column">
          <section className="admin-panel" aria-labelledby="order-customer-heading">
            <h2 id="order-customer-heading" className="admin-panel-title">
              Ship to
            </h2>
            {order.shippingAddress ? (
              <ShippingLabel lines={addressLines(order.shippingAddress)} />
            ) : (
              <p className="admin-hint">No address yet. Stripe collects it when the customer pays.</p>
            )}
            {order.customerEmail && (
              <p className="admin-order-email">
                <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
              </p>
            )}
          </section>

          <section className="admin-panel" aria-labelledby="order-timeline-heading">
            <h2 id="order-timeline-heading" className="admin-panel-title">
              Timeline
            </h2>
            <dl className="admin-order-timeline">
              <TimelineEntry label="Placed" at={order.createdAt} />
              <TimelineEntry label="Paid" at={order.paidAt} />
              <TimelineEntry label="Shipped" at={order.fulfilledAt} />
              <TimelineEntry label="Cancelled" at={order.cancelledAt} />
            </dl>
          </section>

          {(order.stripe.dashboardUrl || order.stripe.checkoutSessionId) && (
            <section className="admin-panel" aria-labelledby="order-stripe-heading">
              <h2 id="order-stripe-heading" className="admin-panel-title">
                Stripe
              </h2>
              {order.stripe.dashboardUrl && (
                <a href={order.stripe.dashboardUrl} target="_blank" rel="noreferrer" className="admin-external-link">
                  <span>View payment in Stripe</span>
                  <ArrowUpRight size={15} />
                </a>
              )}
              <dl className="admin-order-refs">
                {order.stripe.paymentIntentId && (
                  <>
                    <dt>Payment</dt>
                    <dd>{order.stripe.paymentIntentId}</dd>
                  </>
                )}
                {order.stripe.checkoutSessionId && (
                  <>
                    <dt>Checkout</dt>
                    <dd>{order.stripe.checkoutSessionId}</dd>
                  </>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusNote({ order }: { order: AdminOrder }) {
  switch (order.status) {
    case "pending":
      return (
        <p className="admin-order-note">
          The customer hasn&apos;t finished paying. If they don&apos;t, Stripe closes the checkout
          within 30 minutes and the reserved stock goes back on the shelf.
        </p>
      );
    case "cancelled":
      return (
        <p className="admin-order-note">
          This checkout expired or was abandoned. Nothing was charged and the stock was put back.
        </p>
      );
    default:
      return null;
  }
}

function TimelineEntry({ label, at }: { label: string; at: string | null }) {
  if (!at) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{formatDateTime(at)}</dd>
    </>
  );
}

/** The address as it goes on the parcel, with a button to copy it for a label. */
function ShippingLabel({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the address is still on screen to select.
    }
  }

  return (
    <div className="admin-order-address">
      <address>
        {lines.map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </address>
      <button type="button" className="admin-link-button" onClick={copy}>
        <Copy size={15} />
        <span aria-live="polite">{copied ? "Copied" : "Copy address"}</span>
      </button>
    </div>
  );
}
