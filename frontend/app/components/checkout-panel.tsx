"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard, LockKeyhole, UserRound } from "lucide-react";
import { createCheckoutSession, toCartProblem, type CartProblem } from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";
import { isSameLine, type CartLineRef } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { rememberPendingCheckout } from "@/lib/pending-checkout";
import { useCart } from "./cart-provider";
import { signInHref, useCustomerSession } from "./customer-session";

export type CheckoutLine = CartLineRef & {
  /** With the variant: "Bumper Plate (20 kg)". */
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
  const { state: session, customer, getToken } = useCustomerSession();
  const [status, setStatus] = useState<Status>({ state: "idle" });

  function fixCart(problem: CartProblem): string {
    const line: CartLineRef =
      problem.kind !== "variant_required" && problem.variant
        ? { slug: problem.slug, variant: problem.variant }
        : { slug: problem.slug };
    const name = lines.find((item) => isSameLine(item, line))?.name ?? "A product";

    if (problem.kind === "variant_required") {
      remove(line);
      return `${name} now comes in several options, so it was taken out of your cart. Pick one on its page and add it again.`;
    }

    if (problem.kind === "insufficient_stock" && problem.available > 0) {
      setQuantity(line, problem.available);
      return `Only ${problem.available} of ${name} left, so your cart now has that many. Check it and try again.`;
    }

    remove(line);
    return problem.kind === "insufficient_stock"
      ? `${name} just sold out and was removed from your cart.`
      : `${name} is no longer sold and was removed from your cart.`;
  }

  async function startCheckout() {
    setStatus({ state: "redirecting" });

    try {
      // Signed in, the order is saved to the account; otherwise it's a guest checkout.
      const token = (await getToken()) ?? undefined;
      const checkout = await createCheckoutSession(
        lines.map(({ slug, variant, quantity }) => (variant ? { slug, variant, quantity } : { slug, quantity })),
        token
      );
      rememberPendingCheckout(checkout.sessionId);
      // Full navigation to Stripe's page; the button stays in "redirecting" meanwhile.
      window.location.assign(checkout.url);
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

      {customer ? (
        <p className="checkout-account-note">
          <UserRound size={14} aria-hidden="true" />
          <span>
            Signed in as <b className="checkout-account-email">{customer.email}</b>. This order will be saved to your account.
          </span>
        </p>
      ) : (
        session.status === "signed-out" && (
          <p className="checkout-account-note">
            <UserRound size={14} aria-hidden="true" />
            <span>
              Checking out as a guest. <Link href={signInHref("/cart")}>Sign in</Link> to track this order in
              your account.
            </span>
          </p>
        )
      )}

      {status.state === "error" && (
        <p className="checkout-note checkout-note-error" role="alert">
          {status.message}
        </p>
      )}

      <p className="checkout-terms">
        By checking out you accept the <Link href="/terms">terms of sale</Link> and{" "}
        <Link href="/shipping-returns">returns policy</Link>. See how we handle your data in the{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>

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
