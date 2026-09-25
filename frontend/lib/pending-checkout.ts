// Remembers which Stripe session the shopper was sent to, so that if they come back via
// Stripe's "back" link (which carries no session id) the cart can release that session.
// sessionStorage: per tab, gone when the tab closes, which matches a checkout's lifetime.

const storageKey = "forgefit-pending-checkout";

export function rememberPendingCheckout(sessionId: string) {
  try {
    window.sessionStorage.setItem(storageKey, sessionId);
  } catch {
    // Storage blocked: the session simply expires on Stripe's schedule instead.
  }
}

/** Returns the remembered session id once, and forgets it. */
export function takePendingCheckout(): string | null {
  try {
    const sessionId = window.sessionStorage.getItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    return sessionId;
  } catch {
    return null;
  }
}
