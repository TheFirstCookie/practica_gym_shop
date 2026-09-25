import { ApiError, apiRequest } from "./client";
import type { CheckoutOrder, CheckoutSession, DataEnvelope } from "./types";

export type CheckoutItem = {
  slug: string;
  quantity: number;
};

/** Cart problems the API reports as 409s, with the product they concern. */
export type CartProblem =
  | { kind: "insufficient_stock"; slug: string; available: number }
  | { kind: "product_unavailable"; slug: string };

/**
 * Reserves the cart's stock and returns the Stripe payment page to send the shopper to.
 * Prices are never sent: the API reads them from the database. With a signed-in shopper's
 * token the order is saved to their account and Stripe pre-fills their email.
 */
export async function createCheckoutSession(items: CheckoutItem[], token?: string): Promise<CheckoutSession> {
  const { data } = await apiRequest<DataEnvelope<CheckoutSession>>("/checkout/sessions", {
    method: "POST",
    body: { items },
    token
  });
  return data;
}

/** The order behind a Stripe session. Never cached: its status changes as payment lands. */
export async function getCheckoutOrder(sessionId: string, signal?: AbortSignal): Promise<CheckoutOrder> {
  const { data } = await apiRequest<DataEnvelope<CheckoutOrder>>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { cache: "no-store", signal }
  );
  return data;
}

/** Reads a checkout 409 into something the cart can fix, or null for other errors. */
export function toCartProblem(error: unknown): CartProblem | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const details = (error.details ?? {}) as { slug?: string; available?: number };
  if (!details.slug) return null;

  if (error.code === "insufficient_stock") {
    return { kind: "insufficient_stock", slug: details.slug, available: details.available ?? 0 };
  }
  if (error.code === "product_unavailable") {
    return { kind: "product_unavailable", slug: details.slug };
  }
  return null;
}

/**
 * The shopper left Stripe without paying: closes that session and releases its reserved
 * stock right away (otherwise it's held until Stripe expires the session).
 */
export async function abandonCheckoutSession(sessionId: string): Promise<CheckoutOrder> {
  const { data } = await apiRequest<DataEnvelope<CheckoutOrder>>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}/abandon`,
    { method: "POST" }
  );
  return data;
}
