import { isSameLine, updateCart, type CartLine } from "./cart-store";

const storageKey = "forgefit-pending-checkout";
type Pending = { sessionId: string; lines: CartLine[] };
export function rememberPendingCheckout(sessionId: string, lines: CartLine[] = []) {
  try { window.sessionStorage.setItem(storageKey, JSON.stringify({ sessionId, lines })); } catch {}
}
function read(): Pending | null {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "null");
    return value && typeof value.sessionId === "string" && Array.isArray(value.lines) ? value : null;
  } catch { return null; }
}
export function takePendingCheckout(): string | null {
  const pending = read();
  try { window.sessionStorage.removeItem(storageKey); } catch {}
  return pending?.sessionId ?? null;
}
export function completePendingCheckout(sessionId: string) {
  const pending = read();
  if (pending?.sessionId !== sessionId) return;
  try { window.sessionStorage.removeItem(storageKey); } catch { return; }
  updateCart((current) => current.map((line) => ({ ...line,
    quantity: line.quantity - (pending.lines.find((item) => isSameLine(line, item))?.quantity ?? 0)
  })).filter((line) => line.quantity > 0));
}
