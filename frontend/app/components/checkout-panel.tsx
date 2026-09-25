"use client";

import { useState } from "react";
import { CreditCard, LockKeyhole } from "lucide-react";
import { createCheckoutSession, toCartProblem, type CartProblem } from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { rememberPendingCheckout } from "@/lib/pending-checkout";
import { useCart } from "./cart-provider";

export type CheckoutLine = {
  slug: string;
  name: string;
  quantity: number;
};

type CheckoutPanelProps = {
  lines: CheckoutLine[];
  subtotalCents: number;
  currency: string;
  /** Prices are still loading, so the subtotal isn't final. */
  loading: boolean;
  /** Tells the cart what was changed to fix a stock problem (shown even if the cart empties). */
  onCartAdjusted: (message: string) => void;
};

type Status = { state: "idle" } | { state: "redirecting" } | { state: "error"; message: string };

// Messages for the API's error codes that aren't about a specific product.
function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "checkout_unavailable") {
      return "Checkout isn't switched on yet. Your cart is saved, so try again later.";
    }
    if (error.status === 429 || error.status === 502 || error.status === 0) return error.message;
  }
  return "Something went wrong starting checkout. Please try again.";
}

/**
 * Order summary and the Checkout button. The API reserves the stock and returns Stripe's
 * payment page; if the cart is out of date (stock ran out meanwhile), the cart is fixed
 * here and the shopper is told what changed.
 */
export function CheckoutPanel({
  lines,
  subtotalCents,
  currency,
  loading,
  onCartAdjusted
}: CheckoutPanelProps) {
  const { setQuantity, remove } = useCart();
  const [status, setStatus] = useState<Status>({ state: "idle" });

  function fixCart(problem: CartProblem): string {
    const name = lines.find((line) => line.slug === problem.slug)?.name ?? "A product";

    if (problem.kind === "insufficient_stock" && problem.available > 0) {
      setQuantity(problem.slug, problem.available);
      return `Only ${problem.available} of ${name} left, so your cart now has that many. Check it and try again.`;
    }

    remove(problem.slug);
    return problem.kind === "insufficient_stock"
      ? `${name} just sold out and was removed from your cart.`
      : `${name} is no longer sold and was removed from your cart.`;
  }

  async function startCheckout() {
    setStatus({ state: "redirecting" });

    try {
      const session = await createCheckoutSession(
        lines.map(({ slug, quantity }) => ({ slug, quantity }))
      );
      rememberPendingCheckout(session.sessionId);
      // Full navigation to Stripe's page; the button stays in "redirecting" meanwhile.
      window.location.assign(session.url);
    } catch (error) {
      const problem = toCartProblem(error);
      if (problem) {
        onCartAdjusted(fixCart(problem));
        setStatus({ state: "idle" });
      } else {
        setStatus({ state: "error", message: describeError(error) });
      }
    }
  }

  const busy = status.state === "redirecting";

  return (
    <aside className="summary-panel">
      <span>Subtotal</span>
      <strong>{loading ? "…" : formatPrice(subtotalCents, currency)}</strong>
      <p>Shipping address and payment are entered on Stripe&apos;s secure checkout page.</p>
      <button
        type="button"
        className="button primary"
        disabled={loading || busy || lines.length === 0}
        onClick={startCheckout}
      >
        <CreditCard size={18} />
        <span>{busy ? "Opening secure checkout…" : "Checkout"}</span>
      </button>

      {status.state === "error" && (
        <p className="checkout-note checkout-note-error" role="alert">
          {status.message}
        </p>
      )}

      <p className="checkout-test-hint">
        <LockKeyhole size={14} aria-hidden="true" />
        <span>
          Demo shop in Stripe test mode: pay with card <code>4242 4242 4242 4242</code>, any future
          date and any CVC. No real money moves.
        </span>
      </p>
    </aside>
  );
}
