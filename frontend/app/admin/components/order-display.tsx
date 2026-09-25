import type { OrderStatus } from "@/lib/api/types";

// How orders are labelled across the admin pages. The words describe what the admin has
// to do, not the database value: a "paid" order is one waiting to be shipped.

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "To ship",
  fulfilled: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded"
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="admin-badge order-badge" data-status={status}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

// Shared with the shopper's account pages.
export { addressLines, orderNumber } from "@/lib/orders";
