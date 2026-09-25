"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheck, Clock, RotateCcw, ShoppingBag } from "lucide-react";
import { getCheckoutOrder } from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";
import type { CheckoutOrder } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart-provider";

// Stripe usually confirms within seconds; after ~30 s we stop and offer a manual refresh.
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

type State =
  | { status: "loading" }
  | { status: "order"; order: CheckoutOrder; waitedOut: boolean }
  | { status: "not-found" }
  | { status: "error"; message: string };

/** Watches an order until Stripe's payment is confirmed, then shows the receipt. */
export function OrderConfirmation({ sessionId }: { sessionId: string }) {
  const { clear } = useCart();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const cartCleared = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let polls = 0;
    let timer: number | undefined;

    async function check() {
      try {
        const order = await getCheckoutOrder(sessionId, controller.signal);
        polls += 1;
        const waiting = order.status === "pending";
        const waitedOut = waiting && polls >= MAX_POLLS;
        setState({ status: "order", order, waitedOut });
        if (waiting && !waitedOut) timer = window.setTimeout(check, POLL_INTERVAL_MS);
      } catch (error) {
        if (controller.signal.aborted) return;
        setState(
          error instanceof ApiError && error.isNotFound
            ? { status: "not-found" }
            : { status: "error", message: error instanceof Error ? error.message : "Couldn't load your order" }
        );
      }
    }

    void check();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [sessionId, attempt]);

  // The purchase is done, so the cart it came from can go. Once only, even on re-renders.
  const paid = state.status === "order" && (state.order.status === "paid" || state.order.status === "fulfilled");
  useEffect(() => {
    if (paid && !cartCleared.current) {
      cartCleared.current = true;
      clear();
    }
  }, [paid, clear]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  };

  if (state.status === "loading") {
    return (
      <section className="empty-page" aria-busy="true">
        <p className="eyebrow">Checkout</p>
        <h1>Confirming your order…</h1>
      </section>
    );
  }

  if (state.status === "not-found") {
    return (
      <section className="empty-page">
        <p className="eyebrow">Checkout</p>
        <h1>Order not found</h1>
        <p>We couldn&apos;t find an order for this checkout. If you were charged, contact us with your receipt.</p>
        <Link href="/" className="button primary">
          <span>Back to the shop</span>
          <ArrowRight size={18} />
        </Link>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="empty-page">
        <p className="eyebrow">Checkout</p>
        <h1>Couldn&apos;t load your order</h1>
        <p>{state.message} Your payment isn&apos;t affected.</p>
        <button type="button" className="button primary" onClick={retry}>
          <RotateCcw size={18} />
          <span>Try again</span>
        </button>
      </section>
    );
  }

  const { order, waitedOut } = state;

  if (order.status === "cancelled") {
    return (
      <section className="empty-page">
        <p className="eyebrow">Checkout</p>
        <h1>This checkout expired</h1>
        <p>The payment wasn&apos;t completed in time, so nothing was charged. Your cart is still saved.</p>
        <Link href="/cart" className="button primary">
          <ShoppingBag size={18} />
          <span>Back to cart</span>
        </Link>
      </section>
    );
  }

  const price = (cents: number) => formatPrice(cents, order.currency);
  const reference = order.id.slice(0, 8).toUpperCase();

  return (
    <section className="order-confirmation">
      <div className="order-confirmation-heading">
        {paid ? (
          <CircleCheck size={40} strokeWidth={2.2} className="order-icon-paid" aria-hidden="true" />
        ) : (
          <Clock size={40} strokeWidth={2.2} className="order-icon-pending" aria-hidden="true" />
        )}
        <div>
          <p className="eyebrow">Order {reference}</p>
          <h1>{paid ? "Thanks, you're all set" : "Confirming your payment…"}</h1>
          <p aria-live="polite">
            {paid
              ? `Payment received${order.customerEmail ? ` from ${order.customerEmail}` : ""}. Your gear ships to the address you entered within 15 days.`
              : waitedOut
                ? "Stripe hasn't confirmed the payment yet. This can take a minute; refresh to check again."
                : "Waiting for Stripe to confirm the payment. This usually takes a few seconds."}
          </p>
          {waitedOut && (
            <button type="button" className="button secondary" onClick={retry}>
              <RotateCcw size={17} />
              <span>Check again</span>
            </button>
          )}
        </div>
      </div>

      <div className="order-summary">
        <ul>
          {order.items.map((item, index) => (
            <li key={`${item.productId ?? item.name}-${index}`}>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.quantity} × {price(item.unitPriceCents)}
                </small>
              </span>
              <span>{price(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="order-total">
          <span>Total paid</span>
          <strong>{price(order.totalCents)}</strong>
        </div>
      </div>

      <Link href="/#catalog" className="button primary">
        <span>Keep shopping</span>
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
