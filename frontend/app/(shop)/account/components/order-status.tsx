import type { OrderStatus } from "@/lib/api/types";

// How a shopper sees their order's state (the admin's words describe the admin's job
// instead: a "paid" order there is "To ship").
const LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Preparing",
  fulfilled: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded"
};

export function CustomerOrderBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="account-badge" data-status={status}>
      {LABELS[status]}
    </span>
  );
}
