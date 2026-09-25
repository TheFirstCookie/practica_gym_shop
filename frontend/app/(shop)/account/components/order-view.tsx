"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { getMyOrder } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import type { CustomerOrder } from "@/lib/api/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { addressLines, orderNumber } from "@/lib/orders";
import { ProductImage } from "@/app/components/product-image";
import { LoadError } from "./load-error";
import { CustomerOrderBadge } from "./order-status";
import { useAccountData } from "./use-account-data";

/** What happened to the order so far, oldest first. */
function timeline(order: CustomerOrder) {
  return [
    { label: "Placed", at: order.createdAt },
    { label: "Paid", at: order.paidAt },
    { label: "Shipped", at: order.fulfilledAt },
    { label: "Refunded", at: order.refundedAt }
  ].filter((step): step is { label: string; at: string } => Boolean(step.at));
}

/** One of the shopper's orders: what's in it, where it ships and how far along it is. */
export function OrderView({ orderId }: { orderId: string }) {
  const load = useCallback((token: string) => getMyOrder(token, orderId), [orderId]);
  const { state, reload } = useAccountData(load);

  const back = (
    <Link href="/account" className="account-back">
      <ArrowLeft size={16} aria-hidden="true" />
      <span>All orders</span>
    </Link>
  );

  if (state.status === "loading") return <p className="account-muted">Loading the order…</p>;
  if (state.status === "error") {
    if (state.error instanceof ApiError && state.error.isNotFound) {
      return (
        <div className="account-empty">
          <h2>Order not found</h2>
          <p className="account-muted">It isn&apos;t one of the orders on this account.</p>
          {back}
        </div>
      );
    }
    return <LoadError message={state.error.message} onRetry={reload} />;
  }

  const order = state.data;
  const price = (cents: number) => formatPrice(cents, order.currency);
  const delivered = order.status === "paid" || order.status === "fulfilled";

  return (
    <div className="account-order-detail">
      {back}
      <div className="account-order-detail-heading">
        <h2>Order {orderNumber(order.id)}</h2>
        <CustomerOrderBadge status={order.status} />
      </div>

      <div className="account-order-grid">
        <section className="account-card" aria-labelledby="order-items-heading">
          <h3 id="order-items-heading">Items</h3>
          <ul className="account-items">
            {order.items.map((item, index) => {
              const image = (
                <span className="account-thumb">
                  <ProductImage src={item.product?.image ?? null} alt="" />
                </span>
              );
              return (
                <li key={`${item.name}-${index}`}>
                  {item.product ? <Link href={`/product/${item.product.slug}`}>{image}</Link> : image}
                  <span className="account-item-name">
                    {item.product ? <Link href={`/product/${item.product.slug}`}>{item.name}</Link> : item.name}
                    <small>
                      {item.quantity} × {price(item.unitPriceCents)}
                    </small>
                    {/* Paid-for gear can be reviewed, with a "Verified purchase" badge. */}
                    {delivered && item.product && (
                      <Link href={`/product/${item.product.slug}#reviews`} className="account-review-link">
                        <Star size={13} aria-hidden="true" />
                        <span>Write a review</span>
                      </Link>
                    )}
                  </span>
                  <strong>{price(item.lineTotalCents)}</strong>
                </li>
              );
            })}
          </ul>
          <dl className="account-totals">
            {/* Stripe sets the final total; it only differs if checkout added something. */}
            {order.subtotalCents !== order.totalCents && (
              <div>
                <dt>Subtotal</dt>
                <dd>{price(order.subtotalCents)}</dd>
              </div>
            )}
            <div className="account-total">
              <dt>{order.status === "refunded" ? "Total (refunded)" : "Total"}</dt>
              <dd>{price(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <div className="account-order-side">
          <section className="account-card" aria-labelledby="order-progress-heading">
            <h3 id="order-progress-heading">Progress</h3>
            <ol className="account-timeline">
              {timeline(order).map((step) => (
                <li key={step.label}>
                  <strong>{step.label}</strong>
                  <small>{formatDateTime(step.at)}</small>
                </li>
              ))}
            </ol>
            {order.status === "paid" && (
              <p className="account-muted">We&apos;re packing it. Orders ship within 15 days.</p>
            )}
          </section>

          {order.shippingAddress && (
            <section className="account-card" aria-labelledby="order-address-heading">
              <h3 id="order-address-heading">Shipping to</h3>
              <address className="account-address">
                {addressLines(order.shippingAddress).map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
