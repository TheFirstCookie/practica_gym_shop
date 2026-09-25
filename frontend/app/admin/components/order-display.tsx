import type { OrderStatus, ShippingAddress } from "@/lib/api/types";

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

/** Short, readable order number: the first 8 characters of the id, e.g. "#57AB6234". */
export function orderNumber(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string) {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** The address as it goes on a shipping label, one line per entry. */
export function addressLines(address: ShippingAddress): string[] {
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(" ");
  return [
    address.name,
    address.line1,
    address.line2,
    [cityLine, address.state].filter(Boolean).join(", "),
    address.country ? countryName(address.country) : null
  ].filter((line): line is string => Boolean(line));
}
