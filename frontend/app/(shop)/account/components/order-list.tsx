"use client";

import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { listMyOrders } from "@/lib/api/account";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderNumber } from "@/lib/orders";
import { ProductImage } from "@/app/components/product-image";
import { LoadError } from "./load-error";
import { CustomerOrderBadge } from "./order-status";
import { useAccountData } from "./use-account-data";

const THUMBNAILS = 4;

/** The shopper's orders, newest first. Unpaid and expired checkouts aren't listed. */
export function OrderList() {
  const { state, reload } = useAccountData(listMyOrders);

  if (state.status === "loading") return <p className="account-muted">Loading your orders…</p>;
  if (state.status === "error") return <LoadError message={state.error.message} onRetry={reload} />;

  const orders = state.data;
  if (orders.length === 0) {
    return (
      <div className="account-empty">
        <Package size={30} aria-hidden="true" />
        <h2>No orders yet</h2>
        <p className="account-muted">Orders you place while signed in show up here, with their shipping status.</p>
        <Link href="/#catalog" className="button primary">
          Browse the gear
        </Link>
      </div>
    );
  }

  return (
    <ul className="account-orders">
      {orders.map((order) => (
        <li key={order.id}>
          <Link href={`/account/orders/${order.id}`} className="account-order">
            <span className="account-order-main">
              <span className="account-order-title">
                <strong>Order {orderNumber(order.id)}</strong>
                <CustomerOrderBadge status={order.status} />
              </span>
              <small>
                {formatDateTime(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </small>
            </span>
            <span className="account-order-thumbs" aria-hidden="true">
              {order.items.slice(0, THUMBNAILS).map((item, index) => (
                <span className="account-thumb" key={`${item.name}-${index}`}>
                  <ProductImage src={item.product?.image ?? null} alt="" />
                </span>
              ))}
              {order.items.length > THUMBNAILS && (
                <span className="account-thumb account-thumb-more">+{order.items.length - THUMBNAILS}</span>
              )}
            </span>
            <strong className="account-order-total">{formatPrice(order.totalCents, order.currency)}</strong>
            <ChevronRight size={18} aria-hidden="true" className="account-order-chevron" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
